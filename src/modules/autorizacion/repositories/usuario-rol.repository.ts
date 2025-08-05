import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioRol } from '../entities/usuario-rol.entity';

@Injectable()
export class UsuarioRolRepository {
  constructor(
    @InjectRepository(UsuarioRol)
    private readonly repository: Repository<UsuarioRol>,
  ) {}

  async findByUsuarioId(usuarioId: string): Promise<UsuarioRol[]> {
    return this.repository.find({
      where: { usuarioId, isActive: true },
      relations: ['rol'],
    });
  }

  async findByUsuarioIdAndRolId(
    usuarioId: string,
    rolId: string,
  ): Promise<UsuarioRol | null> {
    return this.repository.findOne({
      where: { usuarioId, rolId, isActive: true },
    });
  }

  async create(usuarioRolData: Partial<UsuarioRol>): Promise<UsuarioRol> {
    const usuarioRol = this.repository.create(usuarioRolData);
    return this.repository.save(usuarioRol);
  }

  async softDelete(
    usuarioId: string,
    rolId: string,
    usuarioEliminacion?: string,
  ): Promise<void> {
    await this.repository.update(
      { usuarioId, rolId },
      {
        fechaEliminacion: new Date(),
        usuarioEliminacion,
        isActive: false,
      },
    );
  }
}
