import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PerfilUsuario } from '../entities/perfil-usuario.entity';

@Injectable()
export class PerfilUsuarioRepository {
  constructor(
    @InjectRepository(PerfilUsuario)
    private readonly repository: Repository<PerfilUsuario>,
  ) {}

  async crear(
    datos: Partial<PerfilUsuario>,
    manager?: EntityManager,
  ): Promise<PerfilUsuario> {
    const repo = manager
      ? manager.getRepository(PerfilUsuario)
      : this.repository;
    const entity = repo.create(datos);
    return repo.save(entity);
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<PerfilUsuario | null> {
    return this.repository.findOne({
      where: { usuarioId },
      relations: ['usuario'],
    });
  }

  async actualizar(
    id: string,
    datos: Partial<PerfilUsuario>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(PerfilUsuario)
      : this.repository;

    // Actualizar solo con campos válidos (sin auditoría de BaseEntity)
    await repo.update(id, {
      ...datos,
      fechaModificacion: new Date(), // Solo actualizar timestamp
    });
  }

  // async buscarPorId(id: string): Promise<PerfilUsuario | null> {
  //   return this.repository.findOne({
  //     where: { id },
  //     relations: ['usuario'],
  //   });
  // }

  // Eliminación real, no soft delete (CASCADE se encarga desde Usuario)
  // async eliminar(id: string): Promise<void> {
  //   await this.repository.delete(id);
  // }
}
