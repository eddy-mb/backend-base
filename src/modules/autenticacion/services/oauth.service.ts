import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { JwtTokenService } from './jwt.service';
import { LoggerService } from '../../logging/services/logger.service';
import { GoogleProfile, AuthTokens } from '../interfaces/auth.interfaces';
import { Usuario } from '../entities/usuario.entity';
import { EstadoUsuario } from '../enums/auth.enums';

@Injectable()
export class OAuthService {
  constructor(
    private usuarioRepository: UsuarioRepository,
    private jwtTokenService: JwtTokenService,
    private loggerService: LoggerService,
  ) {}

  /**
   * Procesa login/registro con Google OAuth
   */
  async procesarGoogleOAuth(profile: GoogleProfile): Promise<AuthTokens> {
    try {
      // Buscar usuario por Google ID
      let usuario = await this.usuarioRepository.buscarPorGoogleId(profile.id);

      if (!usuario) {
        // Buscar por email
        usuario = await this.usuarioRepository.buscarPorEmail(profile.email);

        if (usuario) {
          // Usuario existe con email pero sin Google ID, vincularlo
          await this.usuarioRepository.actualizar(usuario.id, {
            googleId: profile.id,
          });
        } else {
          // Crear nuevo usuario
          usuario = await this.crearUsuarioDesdeGoogle(profile);
        }
      }

      // Verificar que la cuenta esté activa
      if (!usuario.registroActivo || !usuario.estaActivo) {
        throw new Error('Cuenta inactiva. Contacte al administrador.');
      }

      // Si el usuario fue creado por Google pero no está verificado, verificarlo
      if (!usuario.estaVerificado && usuario.googleId) {
        await this.usuarioRepository.verificarEmail(usuario.email);
        // Recargar usuario con datos actualizados
        usuario = await this.usuarioRepository.buscarPorEmail(usuario.email);
      }

      if (!usuario) throw new Error('Usuario no encontrado');

      // Actualizar último login
      await this.usuarioRepository.actualizarUltimoLogin(usuario.id);

      // Generar tokens
      const tokens = await this.jwtTokenService.generarTokens(usuario);

      this.loggerService.logWithMeta('Login exitoso con Google OAuth', {
        usuarioId: usuario.id,
        email: usuario.email,
        googleId: profile.id,
      });

      return tokens;
    } catch (error) {
      const errorInstance =
        error instanceof Error ? error : 'Ocurrió un error inesperado';
      this.loggerService.errorWithMeta('Error en Google OAuth', {
        error: errorInstance,
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
        },
      });
      throw error;
    }
  }

  /**
   * Crea nuevo usuario desde perfil de Google
   */
  private async crearUsuarioDesdeGoogle(
    profile: GoogleProfile,
  ): Promise<Usuario> {
    const usuario = await this.usuarioRepository.crear({
      email: profile.email,
      nombre: profile.name,
      googleId: profile.id,
      estado: EstadoUsuario.ACTIVO, // Los usuarios de Google vienen pre-verificados
      emailVerificadoEn: new Date(), // Email ya verificado por Google
      // No establecer password ya que usan OAuth
    });

    this.loggerService.logWithMeta('Usuario creado desde Google OAuth', {
      usuarioId: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      googleId: profile.id,
    });

    return usuario;
  }

  /**
   * Vincula cuenta existente con Google
   */
  async vincularCuentaGoogle(
    usuarioId: number,
    profile: GoogleProfile,
  ): Promise<void> {
    // Verificar que no haya otro usuario con el mismo Google ID
    const usuarioExistente = await this.usuarioRepository.buscarPorGoogleId(
      profile.id,
    );
    if (usuarioExistente && usuarioExistente.id !== usuarioId) {
      throw new Error(
        'Esta cuenta de Google ya está vinculada a otro usuario.',
      );
    }

    // Actualizar usuario
    await this.usuarioRepository.actualizar(usuarioId, {
      googleId: profile.id,
    });

    this.loggerService.logWithMeta('Cuenta vinculada con Google', {
      usuarioId,
      googleId: profile.id,
    });
  }

  /**
   * Desvincula cuenta de Google
   */
  async desvincularCuentaGoogle(usuarioId: number): Promise<void> {
    // Verificar que el usuario tenga contraseña establecida
    const usuario = await this.usuarioRepository.buscarParaAuth('');
    if (!usuario?.password) {
      throw new Error(
        'Debe establecer una contraseña antes de desvincular Google.',
      );
    }

    await this.usuarioRepository.actualizar(usuarioId, {
      googleId: null,
    });

    this.loggerService.logWithMeta('Cuenta desvinculada de Google', {
      usuarioId,
    });
  }
}
