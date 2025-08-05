import { Injectable } from '@nestjs/common';
import { Repository, EntityManager, LessThan, FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TokenUsuario } from '../entities/token-usuario.entity';
import { TipoToken } from '../enums/autenticacion.enum';

@Injectable()
export class TokenUsuarioRepository {
  constructor(
    @InjectRepository(TokenUsuario)
    private readonly repository: Repository<TokenUsuario>,
  ) {}

  // ==================== CRUD BÁSICO ====================

  async crear(
    datos: Partial<TokenUsuario>,
    manager?: EntityManager,
  ): Promise<TokenUsuario> {
    const repo = manager
      ? manager.getRepository(TokenUsuario)
      : this.repository;
    const entity = repo.create(datos);
    return repo.save(entity);
  }

  async buscarPorId(id: string): Promise<TokenUsuario | null> {
    return this.repository.findOne({
      where: { id, revocado: false },
    });
  }

  async buscarPorToken(
    token: string,
    tipo: TipoToken,
  ): Promise<TokenUsuario | null> {
    return this.repository.findOne({
      where: {
        token,
        tipo,
        revocado: false,
      },
      relations: ['usuario'],
    });
  }

  async buscarPorUsuarioYTipo(
    usuarioId: string,
    tipo: TipoToken,
  ): Promise<TokenUsuario[]> {
    return this.repository.find({
      where: {
        usuarioId,
        tipo,
        revocado: false,
      },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async revocar(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(TokenUsuario)
      : this.repository;
    await repo.update(id, { revocado: true });
  }

  async revocarTodosPorUsuario(
    usuarioId: string,
    tipo?: TipoToken,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(TokenUsuario)
      : this.repository;
    const where: FindOptionsWhere<TokenUsuario> = {
      usuarioId,
      revocado: false,
    };
    if (tipo) where.tipo = tipo;

    await repo.update(where, { revocado: true });
  }

  // ==================== LIMPIEZA Y MANTENIMIENTO ====================

  async limpiarExpirados(): Promise<number> {
    const result = await this.repository.delete({
      fechaExpiracion: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  async limpiarRevocados(diasAntiguedad = 30): Promise<number> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    const result = await this.repository.delete({
      revocado: true,
      fechaCreacion: LessThan(fechaLimite),
    });
    return result.affected || 0;
  }

  // ==================== CONSULTAS ESPECÍFICAS ====================

  async contarTokensActivosPorUsuario(usuarioId: string): Promise<number> {
    return this.repository.count({
      where: {
        usuarioId,
        revocado: false,
        fechaExpiracion: LessThan(new Date()),
      },
    });
  }

  async obtenerUltimoRefreshToken(
    usuarioId: string,
  ): Promise<TokenUsuario | null> {
    return this.repository.findOne({
      where: {
        usuarioId,
        tipo: TipoToken.REFRESH,
        revocado: false,
      },
      order: { fechaCreacion: 'DESC' },
    });
  }
}
