import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';

import { UsuariosService } from '../../usuarios/services/usuarios.service';
import { JwtTokenService } from './jwt-token.service';
import { TokenService } from './token.service';
import { LoggerService } from '../../logging/services/logger.service';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { TimeUtil } from '../utils/time.util';

import {
  LoginDto,
  VerificarEmailDto,
  RenovarTokenDto,
  RecuperarPasswordDto,
  ConfirmarPasswordDto,
} from '../dto/auth-request.dto';
import {
  AuthResponse,
  AuthUserInfo,
  RequestInfoData,
} from '../interfaces/auth.interface';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoToken } from '../enums/autenticacion.enum';
import { PASSWORD_CONFIG } from '../../usuarios/constants/usuarios.constants';
import { CrearUsuarioDto } from '@/modules/usuarios';
import { TokenDuration } from '../enums/autenticacion.enum';

/**
 * Servicio de Autenticación
 * Responsabilidad: Solo lógica de autenticación JWT y tokens
 * Delega operaciones de usuarios a UsuariosService
 * Gestiona tokens via TokenService
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly tokenService: TokenService,
    private readonly logger: LoggerService,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  async registrarUsuario(
    datos: CrearUsuarioDto,
    ipRegistro?: string,
    userAgent?: string,
  ): Promise<Usuario> {
    this.logger.log(
      'Registrando usuario con token de verificación',
      'AuthService',
    );

    // Crear usuario usando UsuariosService
    const usuario = await this.usuariosService.crear(
      {
        email: datos.email,
        password: datos.password,
        nombre: datos.nombre,
      },
      ipRegistro,
      userAgent,
    );

    // Generar token de verificación
    const tokenVerificacion = this.tokenService.generateSecureToken(32);
    const verificationExpiresIn = TimeUtil.parseExpirationTime(
      TokenDuration.EMAIL_VERIFICATION,
    );
    await this.tokenService.crearToken(
      usuario.id,
      TipoToken.VERIFICACION_EMAIL,
      tokenVerificacion,
      verificationExpiresIn * 1000, // Convertir a milisegundos
      userAgent,
      ipRegistro,
    );

    // TODO: Enviar email de verificación usando el servicio de comunicaciones (Módulo 12)
    // await this.comunicacionesService.enviarEmailVerificacion(datos.email, tokenVerificacion);

    this.logger.log(
      `Usuario registrado con token: ${usuario.id}`,
      'AuthService',
    );
    return usuario;
  }

  async login(
    datos: LoginDto,
    requestInfo?: RequestInfoData,
  ): Promise<AuthResponse> {
    const usuario = await this.usuariosService.validarCredenciales(
      datos.email,
      datos.password,
    );

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const { accessToken, refreshToken } = this.jwtTokenService.generarTokens(
      usuario.id,
      usuario.email,
    );

    // Guardar refresh token en base de datos con información del dispositivo
    const refreshExpiresIn = TimeUtil.parseExpirationTime(
      this.configuracionService.seguridad.jwtRefreshExpiresIn,
    );
    await this.tokenService.crearToken(
      usuario.id,
      TipoToken.REFRESH,
      refreshToken,
      refreshExpiresIn * 1000, // Convertir a milisegundos
      requestInfo?.userAgent,
      requestInfo?.ip,
    );

    // Delegar actualización a UsuariosService
    await this.usuariosService.actualizarUltimoLogin(usuario.id);

    this.logger.log(`Login exitoso: ${usuario.id}`, 'AuthService');

    return {
      accessToken,
      refreshToken,
      usuario: this.mapearUsuarioInfo(usuario),
    };
  }

  async verificarEmail(datos: VerificarEmailDto): Promise<void> {
    this.logger.log('Iniciando verificación de email', 'AuthService');

    // Buscar token de verificación
    const tokenEntity = await this.tokenService.validarToken(
      datos.token,
      TipoToken.VERIFICACION_EMAIL,
    );

    if (!tokenEntity) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado',
      );
    }

    const usuario = await this.usuariosService.buscarPorId(
      tokenEntity.usuarioId,
    );

    if (usuario.emailVerificado) {
      throw new BadRequestException('El email ya ha sido verificado');
    }

    // Usar método directo del repository para actualizar
    await this.usuariosService.verificarEmailDirecto(usuario.id);

    // Revocar token de verificación
    await this.tokenService.revocarToken(tokenEntity.id);

    this.logger.log(`Email verificado: ${usuario.id}`, 'AuthService');
  }

  async renovarToken(datos: RenovarTokenDto): Promise<{
    accessToken: string;
  }> {
    this.logger.log('Renovando token', 'AuthService');

    // Validar refresh token en base de datos
    const tokenEntity = await this.tokenService.validarToken(
      datos.refreshToken,
      TipoToken.REFRESH,
    );

    if (!tokenEntity) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const usuario = await this.usuariosService.buscarPorId(
      tokenEntity.usuarioId,
    );

    if (!usuario.puedeIniciarSesion()) {
      throw new UnauthorizedException('Usuario no activo');
    }

    const accessToken = await this.jwtTokenService.renovarAccessToken(
      datos.refreshToken,
    );

    // Delegar a UsuariosService
    await this.usuariosService.actualizarUltimaActividad(tokenEntity.usuarioId);

    this.logger.log(`Token renovado: ${tokenEntity.usuarioId}`, 'AuthService');

    return accessToken;
  }

  async logout(
    accessToken: string,
    refreshToken?: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Logout usuario: ${userId}`, 'AuthService');

    //  Agregar a blacklist Redis
    await this.jwtTokenService.agregarABlacklist(accessToken);

    if (refreshToken && userId) {
      //  Revocar en base de datos TokenUsuario
      const tokenEntity = await this.tokenService.validarToken(
        refreshToken,
        TipoToken.REFRESH,
      );

      if (tokenEntity) {
        await this.tokenService.revocarToken(tokenEntity.id);
      }
    }

    this.logger.log(`Logout completado: ${userId}`, 'AuthService');
  }

  async logoutAll(userId: string): Promise<void> {
    this.logger.log(`Logout all sesiones: ${userId}`, 'AuthService');

    // Invalidar en Redis + PostgreSQL
    await this.jwtTokenService.invalidarTodosLosTokens(userId);
    await this.tokenService.revocarTodosPorUsuario(userId, TipoToken.REFRESH);

    this.logger.log(`Logout all completado: ${userId}`, 'AuthService');
  }

  async solicitarRecuperacionPassword(
    datos: RecuperarPasswordDto,
    requestInfo?: RequestInfoData,
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
      return; // Por seguridad, no revelar que el email no existe
    }

    if (!usuario.puedeIniciarSesion()) {
      throw new BadRequestException(
        'La cuenta no está activa o no ha sido verificada',
      );
    }

    // Revocar tokens de recuperación anteriores
    await this.tokenService.revocarTodosPorUsuario(
      usuario.id,
      TipoToken.RECUPERACION_PASSWORD,
    );

    // Generar token de recuperación con información del dispositivo
    const token = this.tokenService.generateSecureToken(32);
    const recoveryExpiresIn = TimeUtil.parseExpirationTime(
      TokenDuration.PASSWORD_RECOVERY,
    );
    await this.tokenService.crearToken(
      usuario.id,
      TipoToken.RECUPERACION_PASSWORD,
      token,
      recoveryExpiresIn * 1000, // Convertir a milisegundos
      requestInfo?.userAgent,
      requestInfo?.ip,
    );

    this.logger.log(
      `Token recuperación generado: ${usuario.id}`,
      'AuthService',
    );

    // TODO: Enviar email con token (Módulo 12)
    // await this.emailService.enviarRecuperacionPassword(usuario, token);
  }

  async confirmarNuevaPassword(datos: ConfirmarPasswordDto): Promise<void> {
    this.logger.log('Confirmando nueva contraseña', 'AuthService');

    // Buscar token de recuperación
    const tokenEntity = await this.tokenService.validarToken(
      datos.token,
      TipoToken.RECUPERACION_PASSWORD,
    );

    if (!tokenEntity) {
      throw new BadRequestException(
        'Token de recuperación inválido o expirado',
      );
    }

    // Cambiar contraseña directamente (bypass validación de password actual)
    const hashedPassword = await bcrypt.hash(
      datos.password,
      PASSWORD_CONFIG.BCRYPT_ROUNDS,
    );

    await this.usuariosService.cambiarPasswordDirecto(
      tokenEntity.usuarioId,
      hashedPassword,
    );

    // Revocar token de recuperación
    await this.tokenService.revocarToken(tokenEntity.id);

    // Invalidar todos los tokens existentes para forzar re-login
    await this.jwtTokenService.invalidarTodosLosTokens(tokenEntity.usuarioId);
    await this.tokenService.revocarTodosPorUsuario(
      tokenEntity.usuarioId,
      TipoToken.REFRESH,
    );

    this.logger.log(
      `Contraseña cambiada via recuperación: ${tokenEntity.usuarioId}`,
      'AuthService',
    );
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
