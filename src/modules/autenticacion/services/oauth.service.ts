import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtTokenService } from './jwt-token.service';
import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { LoggerService } from '../../logging/services/logger.service';
import { GoogleProfile, AuthResponse } from '../interfaces/auth.interface';
import { JwtService } from '@nestjs/jwt';

/**
 * Servicio OAuth - Solo lógica de negocio limpia
 */
@Injectable()
export class OAuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usuariosService: UsuariosService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Getter para acceso al JwtService desde el controller
   */
  getJwtService(): JwtService {
    return this.jwtTokenService.jwtService;
  }

  async loginConGoogle(
    googleProfile: GoogleProfile,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    this.logger.log(
      `OAuth Google login: ${googleProfile.email}`,
      'OAuthService',
    );

    return this.dataSource.transaction(async (manager) => {
      // Buscar usuario existente
      let usuario = await this.usuariosService.buscarPorGoogleIdOEmail(
        googleProfile.id,
        googleProfile.email,
      );

      if (!usuario) {
        // Crear usuario OAuth
        usuario = await this.usuariosService.crearOAuth(
          {
            email: googleProfile.email,
            nombre: googleProfile.name,
            googleId: googleProfile.id,
            oauthProvider: 'google',
            avatar: googleProfile.picture,
          },
          ip,
          userAgent,
        );
      } else {
        // Validar y actualizar usuario existente
        if (!usuario.puedeIniciarSesion()) {
          throw new Error('Usuario no puede iniciar sesión');
        }

        await this.usuariosService.actualizarUltimoLogin(usuario.id);
      }

      // Generar tokens
      const { accessToken, refreshToken } =
        await this.jwtTokenService.generarTokens(usuario.id, usuario.email);

      await manager.update('usuarios', usuario.id, {
        refreshToken,
        ultimaActividad: new Date(),
      });

      this.logger.log(`OAuth Google exitoso: ${usuario.id}`, 'OAuthService');

      return {
        accessToken,
        refreshToken,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          estado: usuario.estado,
          emailVerificado: true,
          ultimaActividad: usuario.ultimaActividad,
        },
      };
    });
  }
}
