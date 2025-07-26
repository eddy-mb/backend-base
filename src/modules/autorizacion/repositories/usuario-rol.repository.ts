import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { UsuarioRol } from '../entities/usuario-rol.entity';
import { EstadoUsuarioRol } from '../enums/autorizacion.enums';

@Injectable()
export class UsuarioRolRepository {
  private repository: Repository<UsuarioRol>;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(UsuarioRol);
  }

  async crear(datos: Partial<UsuarioRol>): Promise<UsuarioRol> {
    const usuarioRol = this.repository.create(datos);
    return this.repository.save(usuarioRol);
  }

  async buscarPorUsuario(usuarioId: number): Promise<UsuarioRol[]> {
    return this.repository.find({
      where: {
        usuarioId,
        estado: EstadoUsuarioRol.ACTIVO,
        isActive: true,
      },
      relations: ['rol'],
      order: { fechaAsignacion: 'DESC' },
    });
  }

  async buscarPorUsuarioYRol(
    usuarioId: number,
    rolId: number,
  ): Promise<UsuarioRol | null> {
    return this.repository.findOne({
      where: {
        usuarioId,
        rolId,
        isActive: true,
      },
      relations: ['rol'],
    });
  }

  async buscarRolesActivosUsuario(usuarioId: number): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('ur')
      .innerJoin('ur.rol', 'rol')
      .select('rol.codigo', 'codigo')
      .where('ur.usuarioId = :usuarioId', { usuarioId })
      .andWhere('ur.estado = :estado', { estado: EstadoUsuarioRol.ACTIVO })
      .andWhere('ur.isActive = :isActive', { isActive: true })
      .andWhere('rol.estado = :rolEstado', { rolEstado: 'activo' })
      .andWhere('rol.isActive = :rolIsActive', { rolIsActive: true })
      .getMany();

    return result.map((r) => r.rol.codigo);
  }

  async buscarUsuariosPorRol(rolId: number): Promise<UsuarioRol[]> {
    return this.repository.find({
      where: {
        rolId,
        estado: EstadoUsuarioRol.ACTIVO,
        isActive: true,
      },
      relations: ['usuario'],
      order: { fechaAsignacion: 'DESC' },
    });
  }

  async existeAsignacion(usuarioId: number, rolId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        usuarioId,
        rolId,
        isActive: true,
      },
    });

    return count > 0;
  }

  async desasignar(
    usuarioId: number,
    rolId: number,
    usuario?: string,
  ): Promise<void> {
    await this.repository.update(
      { usuarioId, rolId },
      {
        estado: EstadoUsuarioRol.INACTIVO,
        fechaEliminacion: new Date(),
        usuarioEliminacion: usuario,
        isActive: false,
      },
    );
  }

  async activarAsignacion(
    usuarioId: number,
    rolId: number,
    usuario?: string,
  ): Promise<void> {
    await this.repository.update(
      { usuarioId, rolId },
      {
        estado: EstadoUsuarioRol.ACTIVO,
        usuarioModificacion: usuario,
        isActive: true,
      },
    );
  }

  async desactivarAsignacion(
    usuarioId: number,
    rolId: number,
    usuario?: string,
  ): Promise<void> {
    await this.repository.update(
      { usuarioId, rolId },
      {
        estado: EstadoUsuarioRol.INACTIVO,
        usuarioModificacion: usuario,
      },
    );
  }

  async listarAsignacionesPaginado(
    page: number,
    limit: number,
    filtros?: {
      usuarioId?: number;
      rolId?: number;
      estado?: EstadoUsuarioRol;
    },
  ): Promise<{ data: UsuarioRol[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('ur')
      .leftJoinAndSelect('ur.usuario', 'usuario')
      .leftJoinAndSelect('ur.rol', 'rol')
      .where('ur.isActive = :isActive', { isActive: true });

    if (filtros?.usuarioId) {
      query.andWhere('ur.usuarioId = :usuarioId', {
        usuarioId: filtros.usuarioId,
      });
    }

    if (filtros?.rolId) {
      query.andWhere('ur.rolId = :rolId', { rolId: filtros.rolId });
    }

    if (filtros?.estado) {
      query.andWhere('ur.estado = :estado', { estado: filtros.estado });
    }

    query
      .orderBy('ur.fechaAsignacion', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async asignarRolesMasivo(
    usuarioId: number,
    roleIds: number[],
    asignadoPor?: string,
  ): Promise<UsuarioRol[]> {
    const asignaciones = roleIds.map((rolId) => ({
      usuarioId,
      rolId,
      asignadoPor,
      estado: EstadoUsuarioRol.ACTIVO,
      fechaAsignacion: new Date(),
    }));

    const entidades = this.repository.create(asignaciones);
    return this.repository.save(entidades);
  }

  async contarUsuariosPorRol(rolId: number): Promise<number> {
    return this.repository.count({
      where: {
        rolId,
        estado: EstadoUsuarioRol.ACTIVO,
        isActive: true,
      },
    });
  }

  async contarRolesPorUsuario(usuarioId: number): Promise<number> {
    return this.repository.count({
      where: {
        usuarioId,
        estado: EstadoUsuarioRol.ACTIVO,
        isActive: true,
      },
    });
  }
}
