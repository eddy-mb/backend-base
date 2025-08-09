import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/services/redis.service';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { LoggerService } from '../../logging/services/logger.service';
import { TokenService } from './token.service';
import { TipoToken } from '../enums/autenticacion.enum';
import {
  JwtPayload,
  TokenValidationResult,
} from '../interfaces/auth.interface';

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configuracionService: ConfiguracionService,
    private readonly logger: LoggerService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Getter para acceso al JwtService
   */
  getJwtService(): JwtService {
    return this.jwtService;
  }

  /**
   * Genera tokens JWT de acceso y renovación
   */
  generarTokens(
    userId: string,
    email: string,
  ): { accessToken: string; refreshToken: string } {
    const config = this.configuracionService.seguridad;

    // Payload base
    const basePayload = { sub: userId, email };

    // Access Token (corta duración)
    const accessPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      ...basePayload,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: config.jwtSecret,
      expiresIn: config.jwtExpiresIn,
    });

    // Refresh Token (larga duración)
    const refreshPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      ...basePayload,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: config.jwtRefreshSecret,
      expiresIn: config.jwtRefreshExpiresIn,
    });

    this.logger.log(
      `Tokens generados para usuario: ${userId}`,
      'JwtTokenService',
    );

    return { accessToken, refreshToken };
  }

  /**
   * Valida y decodifica un token JWT
   */
  async validarToken(
    token: string,
    type: 'access' | 'refresh' = 'access',
  ): Promise<TokenValidationResult> {
    try {
      // Verificar si está en blacklist
      const estaEnBlacklist = await this.estaEnBlacklist(token);
      if (estaEnBlacklist) {
        return { isValid: false, error: 'Token revocado' };
      }

      const config = this.configuracionService.seguridad;
      const secret =
        type === 'access' ? config.jwtSecret : config.jwtRefreshSecret;

      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      // Verificar tipo de token
      if (payload.type !== type) {
        return { isValid: false, error: 'Tipo de token incorrecto' };
      }

      return { isValid: true, payload };
    } catch (error) {
      this.logger.warn(
        `Token inválido: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'JwtTokenService',
      );
      return { isValid: false, error: 'Token inválido o expirado' };
    }
  }

  /**
   * Renueva un access token usando un refresh token válido
   * CORREGIDO: Integra validación JWT + Base de Datos
   */
  async renovarAccessToken(refreshToken: string): Promise<{
    accessToken: string;
  }> {
    // 1. Validar JWT estructura y firma
    const validation = await this.validarToken(refreshToken, 'refresh');
    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    // 2. ✅ NUEVO: Validar en base de datos TokenUsuario
    const tokenEntity = await this.tokenService.validarToken(
      refreshToken,
      TipoToken.REFRESH,
    );

    if (!tokenEntity) {
      throw new UnauthorizedException('Token revocado o no encontrado');
    }

    const { sub: userId, email } = validation.payload;

    // Generar nuevo access token
    const config = this.configuracionService.seguridad;
    const accessPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: config.jwtSecret,
      expiresIn: config.jwtExpiresIn,
    });

    this.logger.log(
      `Token renovado para usuario: ${userId}`,
      'JwtTokenService',
    );

    return { accessToken };
  }

  /**
   * Agrega un token a la blacklist en Redis
   * MEJORADO: Incluye userId para invalidación masiva
   */
  async agregarABlacklist(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode<JwtPayload>(token);

      if (decoded?.exp && decoded?.sub) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);

        if (ttl > 0) {
          const tokenHash = this.generateTokenHash(token);

          // Blacklist individual
          const blacklistKey = `blacklist:${tokenHash}`;
          await this.redisService.set(blacklistKey, '1', ttl);

          // ✅ NUEVO: Índice por usuario para invalidación masiva
          const userTokenKey = `user_tokens:${decoded.sub}:${tokenHash}`;
          await this.redisService.set(userTokenKey, '1', ttl);

          this.logger.log(
            `Token agregado a blacklist: ${decoded.sub}`,
            'JwtTokenService',
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error al agregar token a blacklist: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'JwtTokenService',
      );
    }
  }

  /**
   * Verifica si un token está en la blacklist
   */
  async estaEnBlacklist(token: string): Promise<boolean> {
    try {
      const key = `blacklist:${this.generateTokenHash(token)}`;
      const exists = await this.redisService.exists(key);
      return exists;
    } catch (error) {
      this.logger.error(
        `Error al verificar blacklist: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'JwtTokenService',
      );
      return false; // En caso de error, permitir el token
    }
  }

  /**
   * Invalida todos los access tokens de un usuario (blacklist Redis)
   */
  async invalidarTodosLosTokens(userId: string): Promise<void> {
    try {
      const pattern = `user_tokens:${userId}:*`;
      const keys = await this.redisService.keys(pattern);

      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.redisService.del(key)));

        this.logger.log(
          `${keys.length} tokens access invalidados para usuario: ${userId}`,
          'JwtTokenService',
        );
      } else {
        this.logger.log(
          `No hay tokens access activos para usuario: ${userId}`,
          'JwtTokenService',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al invalidar tokens: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'JwtTokenService',
      );
    }
  }

  /**
   * Genera un hash simple del token para usar como key en Redis
   */
  private generateTokenHash(token: string): string {
    // Usar los últimos 20 caracteres del token como identificador único
    return token.slice(-20);
  }
}
