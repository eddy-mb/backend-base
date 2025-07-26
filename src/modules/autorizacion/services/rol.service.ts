import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { RolRepository } from '../repositories/rol.repository';
import { Rol } from '../entities/rol.entity';
import {
  CrearRolDto,
  ActualizarRolDto,
  CambiarEstadoRolDto,
} from '../dto/rol.dto';
import { EstadoRol } from '../enums/autorizacion.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

@Injectable()
export class RolService {
  constructor(private rolRepository: RolRepository) {}

  /**
   * Crear un nuevo rol
   */
  async crear(datos: CrearRolDto, usuario?: string): Promise<Rol> {
    // Verificar que no exista el código
    const existeCodigo = await this.rolRepository.existeCodigo(datos.codigo);
    if (existeCodigo) {
      throw new ConflictException(
        `Ya existe un rol con el código '${datos.codigo}'`,
      );
    }

    const rol = await this.rolRepository.crear({
      ...datos,
      usuarioCreacion: usuario,
    });

    return rol;
  }

  /**
   * Buscar rol por ID
   */
  async buscarPorId(id: number): Promise<Rol> {
    const rol = await this.rolRepository.buscarPorId(id);
    if (!rol) {
      throw new NotFoundException(`Rol con ID '${id}' no encontrado`);
    }
    return rol;
  }

  /**
   * Buscar rol por código
   */
  async buscarPorCodigo(codigo: string): Promise<Rol> {
    const rol = await this.rolRepository.buscarPorCodigo(codigo);
    if (!rol) {
      throw new NotFoundException(`Rol con código '${codigo}' no encontrado`);
    }
    return rol;
  }

  /**
   * Listar roles activos
   */
  async listarActivos(): Promise<Rol[]> {
    return this.rolRepository.buscarActivos();
  }

  /**
   * Listar roles con paginación
   */
  async listarPaginado(
    paginacion: PaginationQueryDto,
    filtros?: { nombre?: string; estado?: EstadoRol },
  ): Promise<{ data: Rol[]; total: number }> {
    return this.rolRepository.listarPaginado(
      paginacion.page,
      paginacion.limit,
      filtros,
    );
  }

  /**
   * Actualizar rol
   */
  async actualizar(
    id: number,
    datos: ActualizarRolDto,
    usuario?: string,
  ): Promise<Rol> {
    const rol = await this.buscarPorId(id);

    // Si se está cambiando el código, verificar que no exista
    if (datos.estado && datos.estado !== rol.estado) {
      // Si se está desactivando, verificar que no tenga usuarios asignados
      if (datos.estado === EstadoRol.INACTIVO) {
        const cantidadUsuarios = await this.rolRepository.contarUsuarios(id);
        if (cantidadUsuarios > 0) {
          throw new ConflictException(
            `No se puede desactivar el rol '${rol.nombre}' porque tiene ${cantidadUsuarios} usuarios asignados`,
          );
        }
      }
    }

    const rolActualizado = await this.rolRepository.actualizar(id, {
      ...datos,
      usuarioModificacion: usuario,
    });

    if (!rolActualizado) {
      throw new NotFoundException(`Rol con ID '${id}' no encontrado`);
    }

    return rolActualizado;
  }

  /**
   * Cambiar estado del rol
   */
  async cambiarEstado(
    id: number,
    datos: CambiarEstadoRolDto,
    usuario?: string,
  ): Promise<Rol> {
    const rol = await this.buscarPorId(id);

    // Si se está desactivando, verificar que no tenga usuarios asignados
    if (datos.estado === EstadoRol.INACTIVO) {
      const cantidadUsuarios = await this.rolRepository.contarUsuarios(id);
      if (cantidadUsuarios > 0) {
        throw new ConflictException(
          `No se puede desactivar el rol '${rol.nombre}' porque tiene ${cantidadUsuarios} usuarios asignados`,
        );
      }
    }

    const rolActualizado = await this.rolRepository.actualizar(id, {
      estado: datos.estado,
      usuarioModificacion: usuario,
    });

    if (!rolActualizado) {
      throw new NotFoundException(`Rol con ID '${id}' no encontrado`);
    }

    return rolActualizado;
  }

  /**
   * Eliminar rol (soft delete)
   */
  async eliminar(id: number, usuario?: string): Promise<void> {
    const rol = await this.buscarPorId(id);

    // Verificar que no tenga usuarios asignados
    const cantidadUsuarios = await this.rolRepository.contarUsuarios(id);
    if (cantidadUsuarios > 0) {
      throw new ConflictException(
        `No se puede eliminar el rol '${rol.nombre}' porque tiene ${cantidadUsuarios} usuarios asignados`,
      );
    }

    await this.rolRepository.eliminar(id, usuario);
  }

  /**
   * Verificar si existe un rol por código
   */
  async existeCodigo(codigo: string, excludeId?: number): Promise<boolean> {
    return this.rolRepository.existeCodigo(codigo, excludeId);
  }

  /**
   * Contar usuarios asignados a un rol
   */
  async contarUsuarios(id: number): Promise<number> {
    return this.rolRepository.contarUsuarios(id);
  }

  /**
   * Obtener estadísticas de roles
   */
  async obtenerEstadisticas(): Promise<{
    total: number;
    activos: number;
    inactivos: number;
    conUsuarios: number;
  }> {
    const roles = await this.rolRepository.listarPaginado(1, 1000);
    const estadisticas = {
      total: roles.total,
      activos: 0,
      inactivos: 0,
      conUsuarios: 0,
    };

    for (const rol of roles.data) {
      if (rol.estado === EstadoRol.ACTIVO) {
        estadisticas.activos++;
      } else {
        estadisticas.inactivos++;
      }

      const cantidadUsuarios = await this.contarUsuarios(rol.id);
      if (cantidadUsuarios > 0) {
        estadisticas.conUsuarios++;
      }
    }

    return estadisticas;
  }
}
