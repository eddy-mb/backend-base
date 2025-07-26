import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsuarioRolRepository } from '../repositories/usuario-rol.repository';
import { RolRepository } from '../repositories/rol.repository';
import { UsuarioRol } from '../entities/usuario-rol.entity';
import {
  AsignarRolDto,
  CambiarEstadoUsuarioRolDto,
  AsignarRolesMasivoDto,
} from '../dto/usuario-rol.dto';
import { EstadoUsuarioRol } from '../enums/autorizacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class UsuarioRolService {
  constructor(
    private usuarioRolRepository: UsuarioRolRepository,
    private rolRepository: RolRepository,
  ) {}

  /**
   * Asignar un rol a un usuario
   */
  async asignar(
    datos: AsignarRolDto,
    asignadoPor?: string,
  ): Promise<UsuarioRol | null> {
    // Verificar que el rol existe y está activo
    const rol = await this.rolRepository.buscarPorId(datos.rolId);
    if (!rol || !rol.disponible) {
      throw new NotFoundException(
        `Rol con ID '${datos.rolId}' no encontrado o no disponible`,
      );
    }

    // Verificar si ya existe la asignación
    const asignacionExistente =
      await this.usuarioRolRepository.buscarPorUsuarioYRol(
        datos.usuarioId,
        datos.rolId,
      );

    if (asignacionExistente) {
      if (asignacionExistente.activa) {
        throw new ConflictException(
          `El usuario ya tiene asignado el rol '${rol.nombre}'`,
        );
      } else {
        // Reactivar asignación existente
        await this.usuarioRolRepository.activarAsignacion(
          datos.usuarioId,
          datos.rolId,
          asignadoPor,
        );
        return this.usuarioRolRepository.buscarPorUsuarioYRol(
          datos.usuarioId,
          datos.rolId,
        );
      }
    }

    // Crear nueva asignación
    const usuarioRol = await this.usuarioRolRepository.crear({
      usuarioId: datos.usuarioId,
      rolId: datos.rolId,
      asignadoPor,
      estado: EstadoUsuarioRol.ACTIVO,
      usuarioCreacion: asignadoPor,
    });

    return usuarioRol;
  }

  /**
   * Desasignar un rol de un usuario
   */
  async desasignar(
    usuarioId: number,
    rolId: number,
    usuario?: string,
  ): Promise<void> {
    const asignacion = await this.usuarioRolRepository.buscarPorUsuarioYRol(
      usuarioId,
      rolId,
    );

    if (!asignacion) {
      throw new NotFoundException('Asignación de rol no encontrada');
    }

    if (!asignacion.activa) {
      throw new ConflictException('La asignación ya está inactiva');
    }

    await this.usuarioRolRepository.desasignar(usuarioId, rolId, usuario);
  }

  /**
   * Cambiar estado de asignación
   */
  async cambiarEstado(
    usuarioId: number,
    rolId: number,
    datos: CambiarEstadoUsuarioRolDto,
    usuario?: string,
  ): Promise<void> {
    const asignacion = await this.usuarioRolRepository.buscarPorUsuarioYRol(
      usuarioId,
      rolId,
    );

    if (!asignacion) {
      throw new NotFoundException('Asignación de rol no encontrada');
    }

    if (datos.estado === EstadoUsuarioRol.ACTIVO) {
      await this.usuarioRolRepository.activarAsignacion(
        usuarioId,
        rolId,
        usuario,
      );
    } else {
      await this.usuarioRolRepository.desactivarAsignacion(
        usuarioId,
        rolId,
        usuario,
      );
    }
  }

  /**
   * Obtener roles de un usuario
   */
  async obtenerRolesUsuario(usuarioId: number): Promise<UsuarioRol[]> {
    return this.usuarioRolRepository.buscarPorUsuario(usuarioId);
  }

  /**
   * Obtener códigos de roles activos de un usuario
   */
  async obtenerCodigosRolesUsuario(usuarioId: number): Promise<string[]> {
    return this.usuarioRolRepository.buscarRolesActivosUsuario(usuarioId);
  }

  /**
   * Obtener usuarios de un rol
   */
  async obtenerUsuariosRol(rolId: number): Promise<UsuarioRol[]> {
    return this.usuarioRolRepository.buscarUsuariosPorRol(rolId);
  }

  /**
   * Listar asignaciones con paginación
   */
  async listarAsignaciones(
    paginacion: PaginationQueryDto,
    filtros?: {
      usuarioId?: number;
      rolId?: number;
      estado?: EstadoUsuarioRol;
    },
  ): Promise<{ data: UsuarioRol[]; total: number }> {
    return this.usuarioRolRepository.listarAsignacionesPaginado(
      paginacion.page,
      paginacion.limit,
      filtros,
    );
  }

  /**
   * Asignar múltiples roles a un usuario
   */
  async asignarRolesMasivo(
    datos: AsignarRolesMasivoDto,
    asignadoPor?: string,
  ): Promise<UsuarioRol[]> {
    const asignacionesExitosas: UsuarioRol[] = [];
    const errores: string[] = [];

    for (const rolId of datos.roleIds) {
      try {
        // Verificar que el rol existe y está disponible
        const rol = await this.rolRepository.buscarPorId(rolId);
        if (!rol || !rol.disponible) {
          errores.push(`Rol con ID '${rolId}' no encontrado o no disponible`);
          continue;
        }

        // Verificar si ya existe la asignación activa
        const asignacionExistente =
          await this.usuarioRolRepository.buscarPorUsuarioYRol(
            datos.usuarioId,
            rolId,
          );

        if (asignacionExistente?.activa) {
          errores.push(`El usuario ya tiene asignado el rol '${rol.nombre}'`);
          continue;
        }

        // Asignar rol
        const asignacion = await this.asignar(
          { usuarioId: datos.usuarioId, rolId },
          asignadoPor,
        );

        if (asignacion) {
          asignacionesExitosas.push(asignacion);
        }
      } catch (err) {
        const error = err instanceof Error ? err : 'Error desconocido';
        errores.push(`Error asignando rol ${rolId}: ${error}`);
      }
    }

    if (asignacionesExitosas.length === 0 && errores.length > 0) {
      throw new ConflictException(
        `No se pudo asignar ningún rol: ${errores.join(', ')}`,
      );
    }

    return asignacionesExitosas;
  }

  /**
   * Reemplazar roles de un usuario (elimina los existentes y asigna los nuevos)
   */
  async reemplazarRoles(
    usuarioId: number,
    roleIds: number[],
    usuario?: string,
  ): Promise<UsuarioRol[]> {
    // Obtener roles actuales del usuario
    const rolesActuales = await this.obtenerRolesUsuario(usuarioId);

    // Desasignar roles actuales
    for (const rolActual of rolesActuales) {
      if (rolActual.activa) {
        await this.desasignar(usuarioId, rolActual.rolId, usuario);
      }
    }

    // Asignar nuevos roles
    if (roleIds.length > 0) {
      return this.asignarRolesMasivo({ usuarioId, roleIds }, usuario);
    }

    return [];
  }

  /**
   * Verificar si un usuario tiene un rol específico
   */
  async usuarioTieneRol(
    usuarioId: number,
    rolCodigo: string,
  ): Promise<boolean> {
    const codigosRoles = await this.obtenerCodigosRolesUsuario(usuarioId);
    return codigosRoles.includes(rolCodigo);
  }

  /**
   * Verificar si un usuario tiene alguno de los roles especificados
   */
  async usuarioTieneAlgunRol(
    usuarioId: number,
    rolesCodigos: string[],
  ): Promise<boolean> {
    const codigosRoles = await this.obtenerCodigosRolesUsuario(usuarioId);
    return rolesCodigos.some((rol) => codigosRoles.includes(rol));
  }

  /**
   * Obtener estadísticas de asignaciones
   */
  async obtenerEstadisticas(): Promise<{
    totalAsignaciones: number;
    asignacionesActivas: number;
    asignacionesInactivas: number;
    usuariosConRoles: number;
    promedioRolesPorUsuario: number;
  }> {
    const todas = await this.usuarioRolRepository.listarAsignacionesPaginado(
      1,
      10000,
    );

    const estadisticas = {
      totalAsignaciones: todas.total,
      asignacionesActivas: 0,
      asignacionesInactivas: 0,
      usuariosConRoles: 0,
      promedioRolesPorUsuario: 0,
    };

    const usuariosUnicos = new Set<number>();

    for (const asignacion of todas.data) {
      if (asignacion.estado === EstadoUsuarioRol.ACTIVO) {
        estadisticas.asignacionesActivas++;
        usuariosUnicos.add(asignacion.usuarioId);
      } else {
        estadisticas.asignacionesInactivas++;
      }
    }

    estadisticas.usuariosConRoles = usuariosUnicos.size;
    estadisticas.promedioRolesPorUsuario =
      usuariosUnicos.size > 0
        ? estadisticas.asignacionesActivas / usuariosUnicos.size
        : 0;

    return estadisticas;
  }
}
