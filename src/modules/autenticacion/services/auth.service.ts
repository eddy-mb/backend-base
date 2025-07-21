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
import { AuthResponseDto } from '../dto/auth-response.dto';
import { BusinessException } from '../../respuestas/exceptions/exceptions';
import { Auditable } from '../../auditoria/decorators/auditable.decorator';
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

  /**
   * Registra nuevo usuario
   */

  async registrarUsuario(datos: RegistroDto): Promise<Partial<Usuario>> {
    // Verificar si el usuario ya existe
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(
      datos.email,
    );
    if (usuarioExistente) {
      throw BusinessException.alreadyExists('Usuario', 'email', datos.email);
    }

    // Hashear contraseña
    const hashedPassword = await PasswordUtil.hashPassword(datos.password);

    // Crear usuario
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

  /**
   * Inicia sesión con credenciales
   */
  @Auditable({ tabla: 'usuarios', descripcion: 'Login de usuario' })
  async iniciarSesion(datos: LoginDto, ip: string): Promise<AuthResponseDto> {
    // Verificar rate limiting
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

    // Buscar usuario
    const usuario = await this.usuarioRepository.buscarParaAuth(datos.email);
    if (!usuario) {
      await this.incrementarIntentos(rateLimitKey, ttl);
      throw new UnauthorizedException(AUTH_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    }

    // Verificar contraseña
    const passwordValida = await PasswordUtil.comparePassword(
      datos.password,
      usuario.password,
    );
    if (!passwordValida) {
      await this.incrementarIntentos(rateLimitKey, ttl);
      throw new UnauthorizedException(AUTH_MESSAGES.ERRORS.INVALID_CREDENTIALS);
    }

    // Verificar que el usuario pueda iniciar sesión

    if (!usuario.registroActivo) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.ACCOUNT_DELETED);
    }

    if (!usuario.estaVerificado) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.ACCOUNT_NOT_VERIFIED);
    }
    if (!usuario.estaActivo) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.ACCOUNT_INACTIVE);
    }

    // Generar tokens
    const tokens = await this.jwtTokenService.generarTokens(usuario);

    // Actualizar último login
    await this.usuarioRepository.actualizarUltimoLogin(usuario.id);

    // Limpiar intentos de login
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

  /**
   * Cierra sesión del usuario
   */
  @Auditable({ tabla: 'usuarios', descripcion: 'Logout de usuario' })
  async cerrarSesion(userId: number, token: string): Promise<void> {
    // Invalidar refresh token en BD
    await this.jwtTokenService.invalidarRefreshToken(userId);

    // Agregar access token a blacklist en Redis
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

  /**
   * Verifica email del usuario
   */
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

    // Verificar usuario
    await this.usuarioRepository.verificarEmail(validacion.email);

    // Marcar token como usado
    await this.tokenService.marcarTokenComoUsado(token);

    this.loggerService.logWithMeta('Email verificado', {
      email: validacion.email,
    });
  }

  /**
   * Solicita reset de contraseña
   */
  async solicitarResetPassword(email: string): Promise<void> {
    // Verificar rate limiting
    const rateLimitKey = `${AUTH_CONSTANTS.REDIS_KEYS.RESET_ATTEMPTS}:${email}`;
    const { limit, ttl } = AUTH_CONSTANTS.RATE_LIMITS.RESET_PASSWORD;
    const puedeIntentar = await this.verificarLimiteVelocidad(
      rateLimitKey,
      limit,
    );
    if (!puedeIntentar) {
      throw new BadRequestException(AUTH_MESSAGES.ERRORS.TOO_MANY_ATTEMPTS);
    }

    // Verificar que el usuario existe
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) {
      // Por seguridad, no revelamos si el email existe
      return;
    }

    // Incrementar intentos
    await this.incrementarIntentos(rateLimitKey, ttl);

    // Generar token de reset
    // const token = await this.tokenService.crearTokenReset(email);

    // TODO: Enviar email de reset
    // await this.comunicacionesService.enviarEmailReset(email, token);

    this.loggerService.logWithMeta('Reset de contraseña solicitado', { email });
  }

  /**
   * Resetea contraseña
   */
  @Auditable({ tabla: 'usuarios', descripcion: 'Reset de contraseña' })
  async resetearPassword(datos: ResetPasswordDto): Promise<void> {
    const validacion = await this.tokenService.validarToken(
      datos.token,
      TipoToken.RESET_PASSWORD,
    );
    if (!validacion.valido) {
      throw new BadRequestException('Token de reset inválido o expirado');
    }

    // Hashear nueva contraseña
    const hashedPassword = await PasswordUtil.hashPassword(datos.nuevaPassword);

    // Actualizar contraseña
    await this.usuarioRepository.actualizarPassword(
      validacion.email,
      hashedPassword,
    );

    // Marcar token como usado
    await this.tokenService.marcarTokenComoUsado(datos.token);

    // Invalidar todas las sesiones del usuario
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

  /**
   * Reenvía email de verificación
   */
  async reenviarVerificacion(email: string): Promise<void> {
    // Verificar rate limiting
    const rateLimitKey = `resend_verification:${email}`;
    const puedeIntentar = await this.verificarLimiteVelocidad(rateLimitKey, 3); // 3 por hora
    if (!puedeIntentar) {
      throw new BadRequestException(
        'Demasiados intentos de reenvío. Intente más tarde.',
      );
    }

    // Verificar que el usuario existe y no está verificado
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario || usuario.estaVerificado) {
      throw new BadRequestException('Email inválido o ya verificado');
    }

    // Incrementar intentos
    await this.incrementarIntentos(rateLimitKey, 3600);

    // Generar nuevo token
    // const token = await this.tokenService.crearTokenVerificacion(email);

    // TODO: Enviar email
    // await this.comunicacionesService.enviarEmailVerificacion(email, token);

    this.loggerService.logWithMeta('Verificación reenviada', { email });
  }

  /**
   * Renueva access token usando refresh token
   */
  async renovarToken(refreshToken: string): Promise<string> {
    return this.jwtTokenService.renovarToken(refreshToken);
  }

  // Métodos privados para Redis

  /**
   * Verifica límite de velocidad
   */
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
      return true; // En caso de error, permitir la operación
    }
  }

  /**
   * Incrementa contador de intentos
   */
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

  /**
   * Agrega token a blacklist
   */
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

  /**
   * Verifica si token está en blacklist
   */
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
      return false; // En caso de error, no bloquear
    }
  }
}
