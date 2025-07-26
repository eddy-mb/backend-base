import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Rol } from '../entities/rol.entity';
import { EstadoRol } from '../enums/autorizacion.enums';

@Injectable()
export class RolRepository {
  private repository: Repository<Rol>;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(Rol);
  }

  async crear(datos: Partial<Rol>): Promise<Rol> {
    const rol = this.repository.create(datos);
    return this.repository.save(rol);
  }

  async buscarPorId(id: number): Promise<Rol | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  async buscarPorCodigo(codigo: string): Promise<Rol | null> {
    return this.repository.findOne({
      where: { codigo, isActive: true },
    });
  }

  async buscarActivos(): Promise<Rol[]> {
    return this.repository.find({
      where: {
        estado: EstadoRol.ACTIVO,
        isActive: true,
      },
      order: { nombre: 'ASC' },
    });
  }

  async listarPaginado(
    page: number,
    limit: number,
    filtros?: { nombre?: string; estado?: EstadoRol },
  ): Promise<{ data: Rol[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('rol')
      .where('rol.isActive = :isActive', { isActive: true });

    if (filtros?.nombre) {
      query.andWhere('rol.nombre ILIKE :nombre', {
        nombre: `%${filtros.nombre}%`,
      });
    }

    if (filtros?.estado) {
      query.andWhere('rol.estado = :estado', { estado: filtros.estado });
    }

    query
      .orderBy('rol.nombre', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async actualizar(id: number, datos: Partial<Rol>): Promise<Rol | null> {
    await this.repository.update(id, datos);
    return this.buscarPorId(id);
  }

  async eliminar(id: number, usuario?: string): Promise<void> {
    await this.repository.update(id, {
      fechaEliminacion: new Date(),
      usuarioEliminacion: usuario,
      isActive: false,
    });
  }

  async existeCodigo(codigo: string, excludeId?: number): Promise<boolean> {
    const query = this.repository
      .createQueryBuilder('rol')
      .where('rol.codigo = :codigo', { codigo })
      .andWhere('rol.isActive = :isActive', { isActive: true });

    if (excludeId) {
      query.andWhere('rol.id != :excludeId', { excludeId });
    }

    return (await query.getCount()) > 0;
  }

  async contarUsuarios(rolId: number): Promise<number> {
    return this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)')
      .from('usuario_roles', 'ur')
      .where('ur.rol_id = :rolId', { rolId })
      .andWhere('ur.estado = :estado', { estado: 'activo' })
      .andWhere('ur._is_active = :isActive', { isActive: true })
      .getRawOne()
      .then((result: { count: string }) => parseInt(result.count, 10));
  }
}
