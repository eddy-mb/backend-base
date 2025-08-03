import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { JwtTokenService } from './jwt-token.service';
import { LoggerService } from '../../logging/services/logger.service';

import {
  LoginDto,
  RenovarTokenDto,
  RecuperarPasswordDto,
  ConfirmarPasswordDto,
} from '../dto/auth-request.dto';
import { AuthResponse, AuthUserInfo } from '../interfaces/auth.interface';
import { Usuario } from '../../usuarios/entities/usuario.entity';

/**
 * Servicio de Autenticación
 * Responsabilidad: Solo lógica de autenticación JWT y tokens
 * Delega operaciones de usuarios a UsuariosService
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly logger: LoggerService,
  ) {}

  async login(datos: LoginDto): Promise<AuthResponse> {
    const usuario = await this.usuariosService.validarCredenciales(
      datos.email,
      datos.password,
    );

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const { accessToken, refreshToken, expiresIn } =
      this.jwtTokenService.generarTokens(usuario.id, usuario.email);

    // Delegar actualización a UsuariosService
    await this.usuariosService.actualizarUltimoLogin(usuario.id);
    await this.usuariosService.actualizarRefreshToken(usuario.id, refreshToken);

    this.logger.log(`Login exitoso: ${usuario.id}`, 'AuthService');

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer' as const,
      expiresIn,
      usuario: this.mapearUsuarioInfo(usuario),
    };
  }

  async renovarToken(datos: RenovarTokenDto): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
  }> {
    this.logger.log('Renovando token', 'AuthService');

    const validation = await this.jwtTokenService.validarToken(
      datos.refreshToken,
      'refresh',
    );

    if (!validation.isValid || !validation.payload) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const { sub: userId } = validation.payload;
    const usuario = await this.usuariosService.buscarPorId(userId);

    if (!usuario.puedeIniciarSesion()) {
      throw new UnauthorizedException('Usuario no activo');
    }

    if (usuario.refreshToken !== datos.refreshToken) {
      throw new UnauthorizedException('Refresh token no coincide');
    }

    const { accessToken, expiresIn } =
      await this.jwtTokenService.renovarAccessToken(datos.refreshToken);

    // Delegar a UsuariosService
    await this.usuariosService.actualizarUltimaActividad(userId);

    this.logger.log(`Token renovado: ${userId}`, 'AuthService');

    return {
      accessToken,
      tokenType: 'Bearer' as const,
      expiresIn,
    };
  }

  async logout(
    accessToken: string,
    refreshToken?: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Logout usuario: ${userId}`, 'AuthService');

    await this.jwtTokenService.agregarABlacklist(accessToken);

    if (refreshToken) {
      await this.jwtTokenService.agregarABlacklist(refreshToken);
    }

    if (userId) {
      // Delegar a UsuariosService
      await this.usuariosService.limpiarRefreshToken(userId);
    }

    this.logger.log(`Logout completado: ${userId}`, 'AuthService');
  }

  async logoutAll(userId: string): Promise<void> {
    this.logger.log(`Logout all sesiones: ${userId}`, 'AuthService');

    await this.jwtTokenService.invalidarTodosLosTokens(userId);
    // Delegar a UsuariosService
    await this.usuariosService.limpiarRefreshToken(userId);

    this.logger.log(`Logout all completado: ${userId}`, 'AuthService');
  }

  async solicitarRecuperacionPassword(
    datos: RecuperarPasswordDto,
  ): Promise<void> {
    this.logger.log(
      `Recuperación password solicitada: ${datos.email}`,
      'AuthService',
    );

    const usuario = await this.usuariosService.buscarPorEmail(datos.email);

    if (!usuario) {
      this.logger.warn(
        `Recuperación password - email no encontrado: ${datos.email}`,
        'AuthService',
      );
      return;
    }

    if (!usuario.puedeIniciarSesion()) {
      throw new BadRequestException(
        'La cuenta no está activa o no ha sido verificada',
      );
    }

    // Delegar a UsuariosService
    await this.usuariosService.generarTokenRecuperacion(usuario.id);

    this.logger.log(
      `Token recuperación generado: ${usuario.id}`,
      'AuthService',
    );
  }

  async confirmarNuevaPassword(datos: ConfirmarPasswordDto): Promise<void> {
    this.logger.log('Confirmando nueva contraseña', 'AuthService');

    // Delegar búsqueda y cambio a UsuariosService
    await this.usuariosService.confirmarPasswordConToken(
      datos.token,
      datos.password,
    );

    // Invalidar todos los tokens existentes
    const usuario = await this.usuariosService.buscarPorTokenRecuperacion(
      datos.token,
    );
    if (usuario) {
      await this.jwtTokenService.invalidarTodosLosTokens(usuario.id);
    }

    this.logger.log('Contraseña cambiada exitosamente', 'AuthService');
  }

  async validarUsuarioPorId(userId: string): Promise<Usuario | null> {
    try {
      const usuario = await this.usuariosService.buscarPorId(userId);

      if (!usuario.puedeIniciarSesion()) {
        return null;
      }

      // Delegar a UsuariosService
      await this.usuariosService.actualizarUltimaActividad(userId);

      return usuario;
    } catch (error) {
      this.logger.warn(
        `Error validando usuario: ${userId} - ${error instanceof Error ? error.message : 'Error desconocido'}`,
        'AuthService',
      );
      return null;
    }
  }

  private mapearUsuarioInfo(usuario: Usuario): AuthUserInfo {
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      estado: usuario.estado,
      emailVerificado: usuario.emailVerificado,
      ultimaActividad: usuario.ultimaActividad,
    };
  }
}
