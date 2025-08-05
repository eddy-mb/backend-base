import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RolRepository } from '../repositories/rol.repository';
import { UsuarioRolRepository } from '../repositories/usuario-rol.repository';
import {
  CrearRolDto,
  ActualizarRolDto,
  AsignarRolDto,
} from '../dto/autorizacion.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { ServicePaginatedResult } from '../../respuestas/interfaces/interfaces';
import { Rol } from '../entities/rol.entity';
import { UsuarioRol } from '../entities/usuario-rol.entity';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolRepository: RolRepository,
    private readonly usuarioRolRepository: UsuarioRolRepository,
  ) {}

  async crear(dto: CrearRolDto, usuarioCreacion?: string): Promise<Rol> {
    const existente = await this.rolRepository.findByCodigo(dto.codigo);
    if (existente) {
      throw new ConflictException(
        `Ya existe un rol con el código: ${dto.codigo}`,
      );
    }

    return this.rolRepository.create({
      ...dto,
      usuarioCreacion,
    });
  }

  async obtenerTodos(
    query: PaginationQueryDto,
  ): Promise<ServicePaginatedResult<Rol>> {
    const roles = await this.rolRepository.findAll();
    const start = query.saltar;
    const end = start + query.limit;

    return {
      data: roles.slice(start, end),
      total: roles.length,
    };
  }

  async obtenerPorId(id: string): Promise<Rol> {
    const rol = await this.rolRepository.findById(id);
    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }
    return rol;
  }

  async obtenerPorCodigo(codigo: string): Promise<Rol> {
    const rol = await this.rolRepository.findByCodigo(codigo);
    if (!rol) {
      throw new NotFoundException(`Rol con código ${codigo} no encontrado`);
    }
    return rol;
  }

  async actualizar(
    id: string,
    dto: ActualizarRolDto,
    usuarioModificacion?: string,
  ): Promise<void> {
    const rol = await this.obtenerPorId(id);
    if (rol.esSistema) {
      throw new BadRequestException('No se puede modificar un rol del sistema');
    }

    return await this.rolRepository.update(id, {
      ...dto,
      usuarioModificacion,
    });
  }

  async eliminar(id: string, usuarioEliminacion?: string): Promise<void> {
    const rol = await this.obtenerPorId(id);
    if (rol.esSistema) {
      throw new BadRequestException('No se puede eliminar un rol del sistema');
    }

    const usuariosAsignados =
      await this.rolRepository.countUsuariosAsignados(id);
    if (usuariosAsignados > 0) {
      throw new BadRequestException(
        'No se puede eliminar un rol que tiene usuarios asignados',
      );
    }

    await this.rolRepository.softDelete(id, usuarioEliminacion);
  }

  async asignarRol(
    dto: AsignarRolDto,
    usuarioCreacion?: string,
  ): Promise<UsuarioRol> {
    const rol = await this.obtenerPorCodigo(dto.rolCodigo);

    const existente = await this.usuarioRolRepository.findByUsuarioIdAndRolId(
      dto.usuarioId,
      rol.id,
    );
    if (existente) {
      throw new ConflictException(
        `El usuario ya tiene asignado el rol ${dto.rolCodigo}`,
      );
    }

    return this.usuarioRolRepository.create({
      usuarioId: dto.usuarioId,
      rolId: rol.id,
      fechaExpiracion: dto.fechaExpiracion,
      usuarioCreacion,
    });
  }

  async removerRol(
    usuarioId: string,
    rolCodigo: string,
    usuarioEliminacion?: string,
  ): Promise<void> {
    const rol = await this.obtenerPorCodigo(rolCodigo);

    const usuarioRol = await this.usuarioRolRepository.findByUsuarioIdAndRolId(
      usuarioId,
      rol.id,
    );
    if (!usuarioRol) {
      throw new NotFoundException(
        `El usuario no tiene asignado el rol ${rolCodigo}`,
      );
    }

    await this.usuarioRolRepository.softDelete(
      usuarioId,
      rol.id,
      usuarioEliminacion,
    );
  }

  async obtenerRolesUsuario(usuarioId: string) {
    const usuarioRoles =
      await this.usuarioRolRepository.findByUsuarioId(usuarioId);
    const roles = usuarioRoles
      .filter((ur) => ur.estaVigente())
      .map((ur) => ur.rol)
      .filter((rol) => rol?.isActive);
    return roles;
  }
}
