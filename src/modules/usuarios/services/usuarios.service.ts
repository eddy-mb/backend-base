import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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
          ipRegistro,
          userAgentRegistro: userAgent,
          estado: EstadoUsuario.PENDIENTE_VERIFICACION,
          usuarioCreacion: 'sistema',
        },
        manager,
      );

      // Crear perfil por defecto
      await this.perfilRepository.crear(
        {
          usuarioId: usuario.id,
          configuraciones: this.getConfiguracionPorDefecto(),
        },
        manager,
      );

      this.logger.log(`Usuario creado: ${usuario.id}`, 'UsuariosService');
      return usuario;
    });
  }

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

      await this.perfilRepository.actualizar(
        usuario.perfil.id,
        { avatar: nombreArchivo },
        manager,
      );

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

      await this.perfilRepository.actualizar(
        usuario.perfil.id,
        { avatar: null },
        manager,
      );

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

  // ==================== AUTENTICACIÓN (MÉTODOS BÁSICOS) ====================

  async validarCredenciales(
    email: string,
    password: string,
  ): Promise<Usuario | null> {
    const usuario = await this.buscarPorEmail(email);
    if (!usuario || !usuario.password) {
      return null;
    }

    if (usuario.estaBloqueadoPorIntentos()) {
      throw new UnauthorizedException(
        'Cuenta bloqueada por múltiples intentos fallidos',
      );
    }

    const esValido = await bcrypt.compare(password, usuario.password);
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
      usuarioModificacion: id,
    });
  }

  async incrementarIntentosLogin(id: string): Promise<void> {
    await this.usuarioRepository.incrementarIntentos(id);
  }

  async resetearIntentosLogin(id: string): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      intentosLogin: 0,
      usuarioModificacion: id,
    });
  }

  async actualizarUltimaActividad(id: string): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      ultimaActividad: new Date(),
      usuarioModificacion: id,
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

    const esMisma = await bcrypt.compare(
      datos.passwordNuevo,
      usuario.password!,
    );
    if (esMisma) {
      throw new BadRequestException('La nueva contraseña debe ser diferente');
    }

    await this.usuarioRepository.actualizar(id, {
      password: await this.hashearPassword(datos.passwordNuevo),
      usuarioModificacion: id,
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

  async cambiarPasswordDirecto(
    id: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      password: hashedPassword,
      usuarioModificacion: 'sistema',
    });

    this.logger.log(
      `Contraseña cambiada directamente: ${id}`,
      'UsuariosService',
    );
  }

  /**
   * Verificar email directamente (para tokens de verificación)
   * Bypasea validaciones complejas y actualiza directamente
   */
  async verificarEmailDirecto(id: string): Promise<void> {
    await this.usuarioRepository.actualizar(id, {
      emailVerificado: true,
      fechaVerificacion: new Date(),
      estado: EstadoUsuario.ACTIVO,
      usuarioModificacion: 'sistema',
    });

    this.logger.log(`Email verificado directamente: ${id}`, 'UsuariosService');
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private async hashearPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_CONFIG.BCRYPT_ROUNDS);
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
}
