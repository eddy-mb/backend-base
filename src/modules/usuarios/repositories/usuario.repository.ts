import { Injectable } from '@nestjs/common';
import { Repository, EntityManager, SelectQueryBuilder, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { EstadoUsuario } from '../enums/usuario.enum';
import { FiltrosUsuarioDto } from '../dto/request/usuario.dto';

@Injectable()
export class UsuarioRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly repository: Repository<Usuario>,
  ) {}

  // ==================== CRUD BÁSICO ====================

  async crear(
    datos: Partial<Usuario>,
    manager?: EntityManager,
  ): Promise<Usuario> {
    const repo = manager ? manager.getRepository(Usuario) : this.repository;
    const entity = repo.create(datos);
    return repo.save(entity);
  }

  async buscarPorId(
    id: string,
    incluirPerfil = false,
  ): Promise<Usuario | null> {
    const queryBuilder = this.repository
      .createQueryBuilder('usuario')
      .where('usuario.id = :id', { id })
      .andWhere('usuario.fechaEliminacion IS NULL');

    if (incluirPerfil) {
      queryBuilder.leftJoinAndSelect('usuario.perfil', 'perfil');
    }

    return queryBuilder.getOne();
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });
  }

  async buscarPorGoogleId(googleId: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: {
        googleId,
        isActive: true,
      },
    });
  }

  async existeGoogleId(googleId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        googleId,
        isActive: true,
      },
    });
    return count > 0;
  }

  async buscarPorToken(token: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: {
        tokenVerificacion: token,
        isActive: true,
      },
    });
  }

  async buscarPorTokenRecuperacion(token: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: {
        tokenRecuperacion: token,
        isActive: true,
        fechaEliminacion: IsNull(),
      },
    });
  }

  async buscarEliminado(id: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { id },
      withDeleted: true,
    });
  }

  async actualizar(
    id: string,
    datos: Partial<Usuario>,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Usuario) : this.repository;
    await repo.update(id, {
      ...datos,
      fechaModificacion: new Date(),
    });
  }

  async existeEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });
    return count > 0;
  }

  async incrementarIntentos(id: string): Promise<void> {
    await this.repository.increment({ id }, 'intentosLogin', 1);
  }

  // ==================== BÚSQUEDA CON FILTROS ====================

  async buscarConFiltros(
    filtros: FiltrosUsuarioDto,
  ): Promise<[Usuario[], number]> {
    const query = this.crearQueryConFiltros(filtros);
    return query.getManyAndCount();
  }

  private crearQueryConFiltros(
    filtros: FiltrosUsuarioDto,
  ): SelectQueryBuilder<Usuario> {
    const query = this.repository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.perfil', 'perfil')
      .where('usuario.isActive = true');

    // Aplicar filtros
    if (filtros.busqueda) {
      query.andWhere(
        '(usuario.nombre ILIKE :busqueda OR usuario.email ILIKE :busqueda)',
        { busqueda: `%${filtros.busqueda}%` },
      );
    }

    if (filtros.estado) {
      query.andWhere('usuario.estado = :estado', { estado: filtros.estado });
    }

    if (filtros.emailVerificado !== undefined) {
      query.andWhere('usuario.emailVerificado = :emailVerificado', {
        emailVerificado: filtros.emailVerificado,
      });
    }

    if (filtros.fechaCreacionInicio) {
      query.andWhere('usuario.fechaCreacion >= :fechaInicio', {
        fechaInicio: filtros.fechaCreacionInicio,
      });
    }

    if (filtros.fechaCreacionFin) {
      query.andWhere('usuario.fechaCreacion <= :fechaFin', {
        fechaFin: filtros.fechaCreacionFin,
      });
    }

    // Ordenamiento
    const campo = this.validarCampoOrdenamiento(filtros.orderBy);
    const direccion = filtros.orderDirection || 'DESC';
    query.orderBy(`usuario.${campo}`, direccion);

    // Paginación
    const offset = (filtros.page - 1) * filtros.limit;
    query.skip(offset).take(filtros.limit);

    return query;
  }

  private validarCampoOrdenamiento(campo: string): string {
    const camposValidos = [
      'nombre',
      'email',
      'fechaCreacion',
      'fechaModificacion',
      'ultimaActividad',
      'estado',
    ];
    return camposValidos.includes(campo) ? campo : 'fechaCreacion';
  }

  // ==================== ESTADÍSTICAS ====================

  async obtenerEstadisticas(fechaUltimoMes: Date) {
    const baseQuery = this.repository
      .createQueryBuilder('usuario')
      .where('usuario.isActive = true');

    const [
      totalUsuarios,
      usuariosActivos,
      usuariosPendientes,
      usuariosInactivos,
      usuariosSuspendidos,
      registrosUltimoMes,
      usuariosVerificados,
    ] = await Promise.all([
      // Total de usuarios
      baseQuery.getCount(),

      // Por estado
      baseQuery
        .clone()
        .andWhere('usuario.estado = :estado', { estado: EstadoUsuario.ACTIVO })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('usuario.estado = :estado', {
          estado: EstadoUsuario.PENDIENTE_VERIFICACION,
        })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('usuario.estado = :estado', {
          estado: EstadoUsuario.INACTIVO,
        })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('usuario.estado = :estado', {
          estado: EstadoUsuario.SUSPENDIDO,
        })
        .getCount(),

      // Registros último mes
      baseQuery
        .clone()
        .andWhere('usuario.fechaCreacion >= :fecha', { fecha: fechaUltimoMes })
        .getCount(),

      // Email verificado
      baseQuery
        .clone()
        .andWhere('usuario.emailVerificado = :verificado', { verificado: true })
        .getCount(),
    ]);

    return {
      totalUsuarios,
      usuariosActivos,
      usuariosPendientes,
      usuariosInactivos,
      usuariosSuspendidos,
      registrosUltimoMes,
      usuariosVerificados,
    };
  }
}
