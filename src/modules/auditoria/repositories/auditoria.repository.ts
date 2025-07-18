import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditoriaLog } from '../entities/auditoria-log.entity';
import { AuditoriaQueryDto } from '../dto/auditoria.dto';

/**
 * Repository para operaciones de base de datos de auditoría
 *
 * Separa la lógica de acceso a datos del servicio de negocio
 */
@Injectable()
export class AuditoriaRepository {
  constructor(
    @InjectRepository(AuditoriaLog)
    private repository: Repository<AuditoriaLog>,
  ) {}

  /**
   * Crear un nuevo registro de auditoría
   */
  async crear(datos: Partial<AuditoriaLog>): Promise<AuditoriaLog> {
    const log = this.repository.create(datos);
    return await this.repository.save(log);
  }

  /**
   * Buscar logs con filtros avanzados y paginación
   */
  async buscarConFiltros(
    filtros: AuditoriaQueryDto,
  ): Promise<[AuditoriaLog[], number]> {
    const {
      tabla,
      usuarioId,
      accion,
      fechaInicio,
      fechaFin,
      idRegistro,
      correlationId,
      saltar,
      limit,
      orderBy,
      orderDirection,
    } = filtros;
    const query = this.repository.createQueryBuilder('auditoria');
    if (tabla) query.andWhere('auditoria.tabla = :tabla', { tabla });
    if (usuarioId)
      query.andWhere('auditoria.usuarioId = :usuarioId', { usuarioId });
    if (accion) query.andWhere('auditoria.accion = :accion', { accion });
    if (idRegistro)
      query.andWhere('auditoria.idRegistro = :idRegistro', { idRegistro });
    if (correlationId)
      query.andWhere('auditoria.correlationId = :correlationId', {
        correlationId,
      });
    if (fechaInicio && fechaFin) {
      query.andWhere(
        'auditoria.fechaCreacion BETWEEN :fechaInicio AND :fechaFin',
        { fechaInicio, fechaFin },
      );
    } else if (fechaInicio) {
      query.andWhere('auditoria.fechaCreacion >= :fechaInicio', {
        fechaInicio,
      });
    } else if (fechaFin) {
      query.andWhere('auditoria.fechaCreacion <= :fechaFin', { fechaFin });
    }
    query
      .skip(saltar)
      .take(limit)
      .orderBy(`auditoria.${orderBy}`, orderDirection);
    return query.getManyAndCount();
  }
}
