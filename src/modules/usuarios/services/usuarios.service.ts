import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { EstadoUsuario } from '../enums/usuario.enum';
import { CrearUsuarioDto } from '../dto/request/crear-usuario.dto';
import { ActualizarPerfilDto } from '../dto/request/perfil.dto';
import {
  FiltrosUsuarioDto,
  CambiarEstadoUsuarioDto,
  CambiarPasswordDto,
} from '../dto/request/usuario.dto';
import { ServicePaginatedResult } from '../../respuestas/interfaces/interfaces';
import { LoggerService } from '../../logging/services/logger.service';
import { UsuarioRepository } from '../repositories/usuario.repository';
import { PerfilUsuarioRepository } from '../repositories/perfil-usuario.repository';
import { PASSWORD_CONFIG } from '../constants/usuarios.constants';
import { CrearUsuarioOAuthDto } from '../dto/request/crear-usuario-oauth.dto';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly perfilRepository: PerfilUsuarioRepository,
    private readonly logger: LoggerService,
  ) {}

  // ==================== CRUD PRINCIPAL ====================

  /**
   * Buscar usuario por Google ID o email
   */
  async buscarPorGoogleIdOEmail(
    googleId?: string,
    email?: string,
  ): Promise<Usuario | null> {
    if (googleId) {
      const usuario = await this.usuarioRepository.buscarPorGoogleId(googleId);
      if (usuario) return usuario;
    }
    if (email) {
      return this.usuarioRepository.buscarPorEmail(email);
    }
    return null;
  }

  /**
   * Crear usuario OAuth (reutiliza crear() evitando duplicación)
   */
  async crearOAuth(
    datos: CrearUsuarioOAuthDto,
    ipRegistro?: string,
    userAgent?: string,
  ): Promise<Usuario> {
    this.logger.log('Creando usuario OAuth', 'UsuariosService');

    return this.dataSource.transaction(async (manager) => {
      // Validaciones OAuth específicas
      if (
        datos.googleId &&
        (await this.usuarioRepository.existeGoogleId(datos.googleId))
      ) {
        throw new ConflictException('Ya existe un usuario con este Google ID');
      }

      // Crear usuario sin password usando método del repositorio
      const usuarioCreado = await this.usuarioRepository.crear(
        {
          email: datos.email,
          nombre: datos.nombre,
          googleId: datos.googleId,
          oauthProvider: datos.oauthProvider,
          estado: EstadoUsuario.ACTIVO, // OAuth pre-verificado
          emailVerificado: true,
          fechaVerificacion: new Date(),
          ipRegistro,
          userAgentRegistro: userAgent,
        },
        manager,
      );

      // Crear perfil usando repositorio existente
      await this.perfilRepository.crear(
        {
          usuarioId: usuarioCreado.id,
          avatar: datos.avatar,
          configuraciones: this.getConfiguracionPorDefecto(),
        },
        manager,
      );

      this.logger.log(
        `Usuario OAuth creado: ${usuarioCreado.id} (${datos.oauthProvider})`,
        'UsuariosService',
      );

      return usuarioCreado;
    });
  }

  private getConfiguracionPorDefecto() {
    return {
      notificacionesEmail: true,
      notificacionesWeb: true,
      temaOscuro: false,
      mostrarAvatar: true,
      perfilPublico: false,
      configuracionPrivacidad: {
        mostrarEmail: false,
        mostrarTelefono: false,
        mostrarFechaNacimiento: false,
      },
    };
  }

  async crear(
    datos: CrearUsuarioDto,
    ipRegistro?: string,
    userAgent?: string,
  ): Promise<Usuario> {
    this.logger.log('Iniciando creación de usuario', 'UsuariosService');

    return this.dataSource.transaction(async (manager) => {
      // Verificar email único
      const existeEmail = await this.usuarioRepository.existeEmail(datos.email);
      if (existeEmail) {
        throw new ConflictException('Ya existe un usuario con este email');
      }

      // Crear usuario con auditoría automática
      const usuario = await this.usuarioRepository.crear(
        {
          email: datos.email.toLowerCase().trim(),
          password: await this.hashearPassword(datos.password),
          nombre: datos.nombre.trim(),
          tokenVerificacion: uuidv4(),
          ipRegistro,
          userAgentRegistro: userAgent,
          estado: EstadoUsuario.PENDIENTE_VERIFICACION,
          usuarioCreacion: 'sistema', // Usuario sistema para auto-registro
        },
        manager,
      );

      // Crear perfil por defecto (sin auditoría de BaseEntity)
      await this.perfilRepository.crear({ usuarioId: usuario.id }, manager);

      this.logger.log(`Usuario creado: ${usuario.id}`, 'UsuariosService');
      return usuario;
    });
  }

  async buscarPorId(id: string, incluirPerfil = false): Promise<Usuario> {
    const usuario = await this.usuarioRepository.buscarPorId(id, incluirPerfil);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }
    return usuario;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.buscarPorEmail(email.toLowerCase().trim());
  }

  // ==================== GESTIÓN DE PERFIL ====================

  async actualizarPerfil(
    usuarioId: string,
    datos: ActualizarPerfilDto,
  ): Promise<Usuario> {
    return this.dataSource.transaction(async (manager) => {
      const usuario = await this.buscarPorId(usuarioId, true);

      if (!usuario.perfil) {
        throw new NotFoundException('Perfil no encontrado');
      }

      // Actualizar perfil (sin campos de auditoría de BaseEntity)
      await this.perfilRepository.actualizar(
        usuario.perfil.id,
        {
          ...datos,
          fechaNacimiento: datos.fechaNacimiento
            ? new Date(datos.fechaNacimiento)
            : undefined,
          configuraciones: datos.configuraciones,
        },
        manager,
      );

      // Actualizar auditoría solo en Usuario (entity principal)
      await this.usuarioRepository.actualizar(
        usuarioId,
        { usuarioModificacion: usuarioId },
        manager,
      );

      this.logger.log(`Perfil actualizado: ${usuarioId}`, 'UsuariosService');
      return this.buscarPorId(usuarioId, true);
    });
  }

  async actualizarAvatar(
    usuarioId: string,
    nombreArchivo: string,
  ): Promise<string | null | undefined> {
    return this.dataSource.transaction(async (manager) => {
      const usuario = await this.buscarPorId(usuarioId, true);

      if (!usuario.perfil) {
        throw new NotFoundException('Perfil no encontrado');
      }

      const avatarAnterior = usuario.perfil.avatar;

      // Actualizar perfil
      await this.perfilRepository.actualizar(
        usuario.perfil.id,
        { avatar: nombreArchivo },
        manager,
      );

      // Auditoría en Usuario principal
      await this.usuarioRepository.actualizar(
        usuarioId,
        { usuarioModificacion: usuarioId },
        manager,
      );

      this.logger.log(`Avatar actualizado: ${usuarioId}`, 'UsuariosService');
      return avatarAnterior;
    });
  }

  async eliminarAvatar(usuarioId: string): Promise<string | null> {
    return this.dataSource.transaction(async (manager) => {
      const usuario = await this.buscarPorId(usuarioId, true);

      if (!usuario.perfil?.avatar) {
        throw new BadRequestException('El usuario no tiene avatar');
      }

      const avatarAnterior = usuario.perfil.avatar;

      // Actualizar perfil
      await this.perfilRepository.actualizar(
        usuario.perfil.id,
        { avatar: null },
        manager,
      );

      // Auditoría en Usuario principal
      await this.usuarioRepository.actualizar(
        usuarioId,
        { usuarioModificacion: usuarioId },
        manager,
      );

      this.logger.log(`Avatar eliminado: ${usuarioId}`, 'UsuariosService');
      return avatarAnterior;
    });
  }

  construirAvatarUrl(avatar?: string): string | undefined {
    if (!avatar) return undefined;
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/avatares/${avatar}`;
  }

  // ==================== AUTENTICACIÓN ====================

  async validarCredenciales(
    email: string,
    password: string,
  ): Promise<Usuario | null> {
    const usuario = await this.buscarPorEmail(email);
    if (!usuario) return null;

    if (usuario.estaBloqueadoPorIntentos()) {
      throw new UnauthorizedException(
        'Cuenta bloqueada por múltiples intentos fallidos',
      );
    }

    const esValido = await bcrypt.compare(password, usuario.password!);
    if (!esValido) {
      await this.usuarioRepository.incrementarIntentos(usuario.id);
      return null;
    }

    if (!usuario.puedeIniciarSesion()) {
      throw new UnauthorizedException(
        'La cuenta no está activa o no ha sido verificada',
      );
    }

    return usuario;
  }

  async actualizarUltimoLogin(id: string): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      fechaUltimoLogin: new Date(),
      ultimaActividad: new Date(),
      intentosLogin: 0,
      usuarioModificacion: id, // Auto-modificación por login
    });
  }

  // ==================== VERIFICACIÓN ====================

  async verificarEmail(token: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.buscarPorToken(token);
    if (!usuario) {
      throw new BadRequestException(
        'Token de verificación inválido o expirado',
      );
    }

    if (usuario.estado !== EstadoUsuario.PENDIENTE_VERIFICACION) {
      throw new BadRequestException('El usuario ya ha sido verificado');
    }

    return this.dataSource.transaction(async (manager) => {
      await this.usuarioRepository.actualizar(
        usuario.id,
        {
          emailVerificado: true,
          fechaVerificacion: new Date(),
          estado: EstadoUsuario.ACTIVO,
          tokenVerificacion: null,
          usuarioModificacion: 'sistema', // Verificación automática
        },
        manager,
      );

      this.logger.log(`Email verificado: ${usuario.id}`, 'UsuariosService');
      return this.buscarPorId(usuario.id);
    });
  }

  // ==================== GESTIÓN DE ESTADOS ====================

  async cambiarEstado(
    id: string,
    datos: CambiarEstadoUsuarioDto,
    usuarioAdministrador?: string,
  ): Promise<Usuario> {
    const usuario = await this.buscarPorId(id);

    if (!usuario.puedeTransicionarA(datos.estado)) {
      throw new BadRequestException(
        `Transición inválida: ${usuario.estado} -> ${datos.estado}`,
      );
    }

    await this.usuarioRepository.actualizar(id, {
      estado: datos.estado,
      usuarioModificacion: usuarioAdministrador || 'sistema',
    });

    this.logger.log(
      `Estado cambiado ${id}: ${datos.estado}`,
      'UsuariosService',
    );
    return this.buscarPorId(id);
  }

  // ==================== CONTRASEÑA ====================

  async cambiarPassword(id: string, datos: CambiarPasswordDto): Promise<void> {
    const usuario = await this.buscarPorId(id);

    const esValido = await bcrypt.compare(
      datos.passwordActual,
      usuario.password!,
    );
    if (!esValido) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    if (datos.passwordNuevo !== datos.confirmarPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const esMisma = await bcrypt.compare(
      datos.passwordNuevo,
      usuario.password!,
    );
    if (esMisma) {
      throw new BadRequestException('La nueva contraseña debe ser diferente');
    }

    await this.usuarioRepository.actualizar(id, {
      password: await this.hashearPassword(datos.passwordNuevo),
      usuarioModificacion: id, // Auto-modificación
    });

    this.logger.log(`Contraseña cambiada: ${id}`, 'UsuariosService');
  }

  // ==================== BÚSQUEDA Y LISTADO ====================

  async listarConFiltros(
    filtros: FiltrosUsuarioDto,
  ): Promise<ServicePaginatedResult<Usuario>> {
    const [usuarios, total] =
      await this.usuarioRepository.buscarConFiltros(filtros);
    return { data: usuarios, total };
  }

  async obtenerEstadisticas() {
    const fechaUltimoMes = new Date();
    fechaUltimoMes.setMonth(fechaUltimoMes.getMonth() - 1);

    return this.usuarioRepository.obtenerEstadisticas(fechaUltimoMes);
  }

  // ==================== SOFT DELETE ====================

  async eliminar(id: string, usuarioAdministrador?: string): Promise<void> {
    // Solo se elimina Usuario (CASCADE elimina perfil automáticamente)
    await this.usuarioRepository.actualizar(id, {
      fechaEliminacion: new Date(),
      usuarioEliminacion: usuarioAdministrador || 'sistema',
      isActive: false,
    });

    this.logger.log(`Usuario eliminado: ${id}`, 'UsuariosService');
  }

  async restaurar(id: string, usuarioAdministrador?: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.buscarEliminado(id);
    if (!usuario) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado`);
    }

    if (!usuario.fechaEliminacion) {
      throw new BadRequestException('El usuario no está eliminado');
    }

    await this.usuarioRepository.actualizar(id, {
      fechaEliminacion: null,
      usuarioEliminacion: null,
      usuarioModificacion: usuarioAdministrador || 'sistema',
      isActive: true,
    });

    this.logger.log(`Usuario restaurado: ${id}`, 'UsuariosService');
    return this.buscarPorId(id);
  }

  // ==================== MÉTODOS PARA AUTENTICACIÓN ====================

  async actualizarRefreshToken(
    id: string,
    refreshToken: string,
  ): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      refreshToken,
      ultimaActividad: new Date(),
      usuarioModificacion: id,
    });
  }

  async limpiarRefreshToken(id: string): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      refreshToken: null,
      usuarioModificacion: id,
    });
  }

  async actualizarUltimaActividad(id: string): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      ultimaActividad: new Date(),
      usuarioModificacion: id,
    });
  }

  async generarTokenRecuperacion(id: string): Promise<void> {
    const tokenRecuperacion = uuidv4();
    await this.usuarioRepository.actualizar(id, {
      tokenRecuperacion,
      usuarioModificacion: 'sistema',
    });
  }

  async buscarPorTokenRecuperacion(token: string): Promise<Usuario | null> {
    return await this.usuarioRepository.buscarPorTokenRecuperacion(token);
  }

  async confirmarPasswordConToken(
    token: string,
    nuevaPassword: string,
  ): Promise<void> {
    const usuario = await this.buscarPorTokenRecuperacion(token);

    if (!usuario) {
      throw new BadRequestException(
        'Token de recuperación inválido o expirado',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await this.usuarioRepository.actualizar(
        usuario.id,
        {
          password: await this.hashearPassword(nuevaPassword),
          tokenRecuperacion: null,
          refreshToken: null,
          usuarioModificacion: usuario.id,
        },
        manager,
      );

      this.logger.log(
        `Contraseña cambiada con token: ${usuario.id}`,
        'UsuariosService',
      );
    });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async hashearPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_CONFIG.BCRYPT_ROUNDS);
  }
}
