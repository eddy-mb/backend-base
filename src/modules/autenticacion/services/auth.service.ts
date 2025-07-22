import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../../redis/services/redis.service';
import { LoggerService } from '../../logging/services/logger.service';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { JwtTokenService } from './jwt.service';
import { TokenService } from './token.service';
import { PasswordUtil } from '../utils/password.util';
import { EstadoUsuario, TipoToken } from '../enums/auth.enums';
import { AUTH_CONSTANTS, AUTH_MESSAGES } from '../constants/auth.constants';
import { RegistroDto } from '../dto/registro.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { BusinessException } from '../../respuestas/exceptions/exceptions';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private jwtTokenService: JwtTokenService,
    private tokenService: TokenService,
    private redisService: RedisService,
    private loggerService: LoggerService,
  ) {}

  async registrarUsuario(datos: RegistroDto): Promise<Partial<Usuario>> {
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(
      datos.email,
    );
    if (usuarioExistente) {
      throw BusinessException.alreadyExists('Usuario', 'email', datos.email);
    }

    const hashedPassword = await PasswordUtil.hashPassword(datos.password);

    const usuario = await this.usuarioRepository.crear({
      email: datos.email,
      password: hashedPassword,
      nombre: datos.nombre,
      estado: EstadoUsuario.PENDIENTE_VERIFICACION,
    });

    // Generar token de verificación
    // const token = await this.tokenService.crearTokenVerificacion(datos.email);

    // TODO: Enviar email de verificación usando el servicio de comunicaciones
    // await this.comunicacionesService.enviarEmailVerificacion(datos.email, token);

    this.loggerService.logWithMeta('Usuario registrado', {
      email: datos.email,
      nombre: datos.nombre,
    });

    const { id, email, nombre, estado } = usuario;
    return { id, email, nombre, estado };
  }

  async iniciarSesion(datos: LoginDto, ip: string) {
    const rateLimitKey = `${AUTH_CONSTANTS.REDIS_KEYS.LOGIN_ATTEMPTS}:${ip}`;
    const { limit, ttl } = AUTH_CONSTANTS.RATE_LIMITS.LOGIN;
    const puedeIntentar = await this.verificarLimiteVelocidad(
      rateLimitKey,
      limit,
    );
    if (!puedeIntentar) {
      throw new BadRequestException(
        'Demasiados intentos de login. Intente más tarde.',
      );
    }

    const usuario = await this.usuarioRepository.buscarParaAuth(datos.email);
    if (!usuario) {
      await this.incrementarIntentos(rateLimitKey, ttl);
      throw new UnauthorizedException(AUTH_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    }

    const passwordValida = await PasswordUtil.comparePassword(
      datos.password,
      usuario.password,
    );
    if (!passwordValida) {
      await this.incrementarIntentos(rateLimitKey, ttl);
      throw new UnauthorizedException(AUTH_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    }

    if (!usuario.registroActivo) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.ACCOUNT_DELETED);
    }

    if (!usuario.estaVerificado) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.ACCOUNT_NOT_VERIFIED);
    }
    if (!usuario.estaActivo) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.ACCOUNT_INACTIVE);
    }

    const tokens = await this.jwtTokenService.generarTokens(usuario);
    await this.usuarioRepository.actualizarUltimoLogin(usuario.id);
    await this.redisService.del(rateLimitKey);

    this.loggerService.logWithMeta('Usuario inició sesión', {
      usuarioId: usuario.id,
      email: usuario.email,
      ip,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        estado: usuario.estado,
        emailVerificado: usuario.estaVerificado,
      },
    };
  }

  async cerrarSesion(userId: number, token: string): Promise<void> {
    await this.jwtTokenService.invalidarRefreshToken(userId);

    const decoded = this.jwtTokenService.decodeToken(token);
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.agregarTokenABlacklist(token, ttl);
      }
    }

    this.loggerService.logWithMeta('Usuario cerró sesión', {
      usuarioId: userId,
    });
  }

  async verificarEmail(token: string): Promise<void> {
    const validacion = await this.tokenService.validarToken(
      token,
      TipoToken.VERIFICACION_EMAIL,
    );
    if (!validacion.valido) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado',
      );
    }

    await this.usuarioRepository.verificarEmail(validacion.email);
    await this.tokenService.marcarTokenComoUsado(token);

    this.loggerService.logWithMeta('Email verificado', {
      email: validacion.email,
    });
  }

  async solicitarResetPassword(email: string): Promise<void> {
    const rateLimitKey = `${AUTH_CONSTANTS.REDIS_KEYS.RESET_ATTEMPTS}:${email}`;
    const { limit, ttl } = AUTH_CONSTANTS.RATE_LIMITS.RESET_PASSWORD;
    const puedeIntentar = await this.verificarLimiteVelocidad(
      rateLimitKey,
      limit,
    );
    if (!puedeIntentar) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.TOO_MANY_ATTEMPTS);
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      return;
    }

    await this.incrementarIntentos(rateLimitKey, ttl);

    // Generar token de reset
    // const token = await this.tokenService.crearTokenReset(email);

    // TODO: Enviar email de reset usando el servicio de comunicaciones
    // await this.comunicacionesService.enviarEmailReset(email, token);

    this.loggerService.logWithMeta('Reset de contraseña solicitado', { email });
  }

  async resetearPassword(datos: ResetPasswordDto): Promise<void> {
    const validacion = await this.tokenService.validarToken(
      datos.token,
      TipoToken.RESET_PASSWORD,
    );
    if (!validacion.valido) {
      throw new BadRequestException('Token de reset inválido o expirado');
    }

    const hashedPassword = await PasswordUtil.hashPassword(datos.nuevaPassword);
    await this.usuarioRepository.actualizarPassword(
      validacion.email,
      hashedPassword,
    );
    await this.tokenService.marcarTokenComoUsado(datos.token);

    const usuario = await this.usuarioRepository.buscarPorEmail(
      validacion.email,
    );
    if (usuario) {
      await this.jwtTokenService.invalidarRefreshToken(usuario.id);
    }

    this.loggerService.logWithMeta('Contraseña reseteada', {
      email: validacion.email,
    });
  }

  async reenviarVerificacion(email: string): Promise<void> {
    const rateLimitKey = `resend_verification:${email}`;
    const puedeIntentar = await this.verificarLimiteVelocidad(rateLimitKey, 3);
    if (!puedeIntentar) {
      throw new BadRequestException(
        'Demasiados intentos de reenvío. Intente más tarde.',
      );
    }

    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario || usuario.estaVerificado) {
      throw new BadRequestException('Email inválido o ya verificado');
    }

    await this.incrementarIntentos(rateLimitKey, 3600);

    // Generar nuevo token
    // const token = await this.tokenService.crearTokenVerificacion(email);

    // TODO: Enviar email de verificación usando el servicio de comunicaciones
    // await this.comunicacionesService.enviarEmailVerificacion(email, token);

    this.loggerService.logWithMeta('Verificación reenviada', { email });
  }

  async renovarToken(refreshToken: string): Promise<string> {
    return this.jwtTokenService.renovarToken(refreshToken);
  }

  private async verificarLimiteVelocidad(
    key: string,
    limite: number,
  ): Promise<boolean> {
    try {
      const intentos = await this.redisService.get(key);
      const intentosActuales = intentos ? parseInt(intentos) : 0;
      return intentosActuales < limite;
    } catch (error) {
      const err = error instanceof Error ? error : 'Error desconocido';
      this.loggerService.errorWithMeta('Error verificando rate limit', {
        key,
        error: err,
      });
      return true;
    }
  }

  private async incrementarIntentos(key: string, ttl: number): Promise<void> {
    try {
      const intentos = await this.redisService.get(key);
      const intentosActuales = intentos ? parseInt(intentos) : 0;
      await this.redisService.set(key, (intentosActuales + 1).toString(), ttl);
    } catch (error) {
      const err = error instanceof Error ? error : 'Error desconocido';
      this.loggerService.errorWithMeta('Error incrementando intentos', {
        key,
        error: err,
      });
    }
  }

  private async agregarTokenABlacklist(
    token: string,
    ttl: number,
  ): Promise<void> {
    try {
      const key = `${AUTH_CONSTANTS.REDIS_KEYS.BLACKLIST}:${token}`;
      await this.redisService.set(key, '1', ttl);
    } catch (error) {
      const err = error instanceof Error ? error : 'Error desconocido';
      this.loggerService.errorWithMeta('Error agregando token a blacklist', {
        error: err,
      });
    }
  }

  async estaTokenEnBlacklist(token: string): Promise<boolean> {
    try {
      const key = `${AUTH_CONSTANTS.REDIS_KEYS.BLACKLIST}:${token}`;
      const resultado = await this.redisService.exists(key);
      return resultado;
    } catch (error) {
      const err = error instanceof Error ? error : 'Error desconocido';
      this.loggerService.errorWithMeta('Error verificando blacklist', {
        error: err,
      });
      return false;
    }
  }
}
