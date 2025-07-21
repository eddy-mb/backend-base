import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { JwtPayload, AuthTokens } from '../interfaces/auth.interfaces';
import { Usuario } from '../entities/usuario.entity';

@Injectable()
export class JwtTokenService {
  constructor(
    private jwtService: JwtService,
    private configuracionService: ConfiguracionService,
    private usuarioRepository: UsuarioRepository,
  ) {}

  /**
   * Genera access token y refresh token
   */
  async generarTokens(usuario: Usuario): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configuracionService.seguridad.jwtSecret,
        expiresIn: this.configuracionService.seguridad.jwtExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configuracionService.seguridad.jwtRefreshSecret,
        expiresIn: this.configuracionService.seguridad.jwtRefreshExpiresIn,
      }),
    ]);

    // Guardar refresh token en BD
    await this.usuarioRepository.actualizarRefreshToken(
      usuario.id,
      refreshToken,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Valida access token
   */
  async validarAccessToken(token: string): Promise<JwtPayload> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.configuracionService.seguridad.jwtSecret,
    });
  }

  /**
   * Valida refresh token
   */
  async validarRefreshToken(token: string): Promise<boolean> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configuracionService.seguridad.jwtRefreshSecret,
      });

      // Verificar que el token exista en BD
      const usuario = await this.usuarioRepository.buscarPorRefreshToken(token);
      return usuario !== null && usuario.id === payload.sub;
    } catch {
      return false;
    }
  }

  /**
   * Renueva access token usando refresh token
   */
  async renovarToken(refreshToken: string): Promise<string> {
    const esValido = await this.validarRefreshToken(refreshToken);
    if (!esValido) {
      throw new Error('Refresh token inválido');
    }

    const usuario =
      await this.usuarioRepository.buscarPorRefreshToken(refreshToken);
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      email: usuario.email,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configuracionService.seguridad.jwtSecret,
      expiresIn: this.configuracionService.seguridad.jwtExpiresIn,
    });
  }

  /**
   * Invalida refresh token
   */
  async invalidarRefreshToken(usuarioId: number): Promise<void> {
    await this.usuarioRepository.actualizarRefreshToken(usuarioId, null);
  }

  /**
   * Extrae payload de token sin validar
   */
  decodeToken(token: string): JwtPayload {
    return this.jwtService.decode(token);
  }
}
