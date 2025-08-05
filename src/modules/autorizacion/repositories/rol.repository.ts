import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../entities/rol.entity';

@Injectable()
export class RolRepository {
  constructor(
    @InjectRepository(Rol)
    private readonly repository: Repository<Rol>,
  ) {}

  async findAll(): Promise<Rol[]> {
    return this.repository.find({
      where: { isActive: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findById(id: string): Promise<Rol | null> {
    return this.repository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByCodigo(codigo: string): Promise<Rol | null> {
    return this.repository.findOne({
      where: { codigo, isActive: true },
    });
  }

  async create(rolData: Partial<Rol>): Promise<Rol> {
    const rol = this.repository.create(rolData);
    return this.repository.save(rol);
  }

  async update(id: string, rolData: Partial<Rol>): Promise<void> {
    await this.repository.update(id, rolData);
  }

  async softDelete(id: string, usuarioEliminacion?: string): Promise<void> {
    await this.repository.update(id, {
      fechaEliminacion: new Date(),
      usuarioEliminacion,
      isActive: false,
    });
  }

  async countUsuariosAsignados(rolId: string): Promise<number> {
    return this.repository
      .createQueryBuilder('rol')
      .innerJoin('usuario_roles', 'ur', 'ur.rol_id = rol.id')
      .where('rol.id = :rolId', { rolId })
      .andWhere('ur._is_active = true')
      .getCount();
  }
}
