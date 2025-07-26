import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Politica } from '../entities/politica.entity';
import { AccionHttp, AplicacionTipo } from '../enums/autorizacion.enums';

@Injectable()
export class PoliticaRepository {
  private repository: Repository<Politica>;

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(Politica);
  }

  async crear(datos: Partial<Politica>): Promise<Politica> {
    const politica = this.repository.create(datos);
    return this.repository.save(politica);
  }

  async buscarPorRol(rol: string): Promise<Politica[]> {
    return this.repository.find({
      where: {
        rol,
        isActive: true,
      },
      order: { recurso: 'ASC', accion: 'ASC' },
    });
  }

  async buscarPolitica(
    rol: string,
    recurso: string,
    accion: AccionHttp,
    aplicacion: AplicacionTipo,
  ): Promise<Politica | null> {
    return this.repository.findOne({
      where: {
        rol,
        recurso,
        accion,
        aplicacion,
        isActive: true,
      },
    });
  }

  async buscarPorRecursoYAccion(
    rol: string,
    recursos: string[],
    accion: AccionHttp,
    aplicacion: AplicacionTipo = AplicacionTipo.BACKEND,
  ): Promise<Politica[]> {
    return this.repository
      .createQueryBuilder('politica')
      .where('politica.rol = :rol', { rol })
      .andWhere('politica.recurso IN (:...recursos)', { recursos })
      .andWhere('politica.accion = :accion', { accion })
      .andWhere('politica.aplicacion = :aplicacion', { aplicacion })
      .andWhere('politica.isActive = :isActive', { isActive: true })
      .orderBy('politica.recurso', 'ASC')
      .getMany();
  }

  async listarPaginado(
    page: number,
    limit: number,
    filtros?: {
      rol?: string;
      recurso?: string;
      accion?: AccionHttp;
      aplicacion?: AplicacionTipo;
    },
  ): Promise<{ data: Politica[]; total: number }> {
    const query = this.repository
      .createQueryBuilder('politica')
      .where('politica.isActive = :isActive', { isActive: true });

    if (filtros?.rol) {
      query.andWhere('politica.rol = :rol', { rol: filtros.rol });
    }

    if (filtros?.recurso) {
      query.andWhere('politica.recurso ILIKE :recurso', {
        recurso: `%${filtros.recurso}%`,
      });
    }

    if (filtros?.accion) {
      query.andWhere('politica.accion = :accion', { accion: filtros.accion });
    }

    if (filtros?.aplicacion) {
      query.andWhere('politica.aplicacion = :aplicacion', {
        aplicacion: filtros.aplicacion,
      });
    }

    query
      .orderBy('politica.rol', 'ASC')
      .addOrderBy('politica.recurso', 'ASC')
      .addOrderBy('politica.accion', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async eliminar(
    rol: string,
    recurso: string,
    accion: AccionHttp,
    aplicacion: AplicacionTipo,
    usuario?: string,
  ): Promise<void> {
    await this.repository.update(
      { rol, recurso, accion, aplicacion },
      {
        fechaEliminacion: new Date(),
        usuarioEliminacion: usuario,
        isActive: false,
      },
    );
  }

  async crearMasivo(politicas: Partial<Politica>[]): Promise<Politica[]> {
    const entidades = this.repository.create(politicas);
    return this.repository.save(entidades);
  }

  async eliminarPorRol(rol: string, usuario?: string): Promise<void> {
    await this.repository.update(
      { rol, isActive: true },
      {
        fechaEliminacion: new Date(),
        usuarioEliminacion: usuario,
        isActive: false,
      },
    );
  }

  async obtenerRolesConPoliticas(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('politica')
      .select('DISTINCT politica.rol', 'rol')
      .where('politica.isActive = :isActive', { isActive: true })
      .orderBy('politica.rol', 'ASC')
      .getMany();

    return result.map((r) => r.rol);
  }

  async existePolitica(
    rol: string,
    recurso: string,
    accion: AccionHttp,
    aplicacion: AplicacionTipo,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        rol,
        recurso,
        accion,
        aplicacion,
        isActive: true,
      },
    });

    return count > 0;
  }
}
