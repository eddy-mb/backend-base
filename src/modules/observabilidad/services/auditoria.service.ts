import { Injectable } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../database/services/prisma.service';
import { LoggerService } from './logger.service';
import {
  AuditoriaEntry,
  AuditoriaQuery,
  AuditoriaStats,
  AuditoriaAction,
  AuditoriaMetadata,
} from '../interfaces/auditoria.interface';
import { AuditoriaQueryDto } from '../dto/auditoria-query.dto';
import { RequestWithUser } from '../interfaces/interceptor.interface';
import { AuditoriaLog, Prisma } from '@prisma/client'; // ← TIPO DE PRISMA
import { AuditoriaUtils } from '../utils/auditoria.utils'; // ← UTILIDADES

/**
 * Servicio para gestión de auditoría de cambios en el sistema
 */
@Injectable()
export class AuditoriaService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  /**
   * Busca registros usando AuditoriaQueryDto (para endpoints HTTP)
   */
  async buscarConDto(
    dto: AuditoriaQueryDto,
  ): Promise<{ data: AuditoriaLog[]; total: number }> {
    const query: AuditoriaQuery = {
      tabla: dto.tabla,
      idRegistro: dto.idRegistro,
      accion: dto.accion,
      usuarioId: dto.usuarioId,
      fechaDesde: dto.fechaDesdeParsed, // Usar helper para convertir string a Date
      fechaHasta: dto.fechaHastaParsed, // Usar helper para convertir string a Date
      limite: dto.limite, // Usar getter calculado
      offset: dto.offset, // Usar getter calculado
    };

    return this.buscar(query);
  }

  /**
   * Crea un registro de auditoría
   */
  async crear(entry: AuditoriaEntry): Promise<AuditoriaLog> {
    try {
      // Sanitizar datos sensibles antes de guardar
      const sanitizedEntry = this.sanitizeAuditEntry(entry);

      const auditoriaLog = await this.prisma.auditoriaLog.create({
        data: {
          tabla: sanitizedEntry.tabla,
          idRegistro: sanitizedEntry.idRegistro,
          accion: sanitizedEntry.accion,
          valoresAnteriores: sanitizedEntry.valoresAnteriores || '',
          valoresNuevos: sanitizedEntry.valoresNuevos || '',
          usuarioId: sanitizedEntry.usuarioId,
          metadatos: sanitizedEntry.metadatos,
        },
      });

      // Log de la acción de auditoría
      this.logger.logAudit(
        `Auditoría registrada: ${entry.accion} en ${entry.tabla}:${entry.idRegistro}`,
        {
          tabla: entry.tabla,
          idRegistro: entry.idRegistro,
          accion: entry.accion,
          usuarioId: entry.usuarioId,
        },
      );

      return auditoriaLog; // ← Retorna tipo Prisma directamente
    } catch (error: unknown) {
      const errorEntry =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(errorEntry, {
        context: 'AuditoriaService.crear',
        tabla: entry.tabla,
        idRegistro: entry.idRegistro,
        accion: entry.accion,
      });
      throw errorEntry;
    }
  }

  /**
   * Registra una operación de creación
   */
  async registrarCreacion(
    tabla: string,
    idRegistro: string,
    valoresNuevos: any,
    metadata: AuditoriaMetadata,
  ): Promise<AuditoriaLog> {
    return this.crear({
      tabla,
      idRegistro,
      accion: AuditoriaAction.CREATE,
      valoresNuevos,
      metadatos: metadata,
      usuarioId: metadata.userId,
    });
  }

  /**
   * Registra una operación de actualización
   */
  async registrarActualizacion(
    tabla: string,
    idRegistro: string,
    valoresAnteriores: any,
    valoresNuevos: any,
    metadata: AuditoriaMetadata,
  ): Promise<AuditoriaLog> {
    return this.crear({
      tabla,
      idRegistro,
      accion: AuditoriaAction.UPDATE,
      valoresAnteriores,
      valoresNuevos,
      metadatos: metadata,
      usuarioId: metadata.userId,
    });
  }

  /**
   * Registra una operación de eliminación
   */
  async registrarEliminacion(
    tabla: string,
    idRegistro: string,
    valoresAnteriores: any,
    metadata: AuditoriaMetadata,
  ): Promise<AuditoriaLog> {
    return this.crear({
      tabla,
      idRegistro,
      accion: AuditoriaAction.DELETE,
      valoresAnteriores,
      metadatos: metadata,
      usuarioId: metadata.userId,
    });
  }

  /**
   * Busca registros de auditoría con filtros
   */
  async buscar(
    query: AuditoriaQuery,
  ): Promise<{ data: AuditoriaLog[]; total: number }> {
    try {
      const where: Prisma.AuditoriaLogWhereInput = {};

      if (query.tabla) where.tabla = query.tabla;
      if (query.idRegistro) where.idRegistro = query.idRegistro;
      if (query.accion) where.accion = query.accion;
      if (query.usuarioId) where.usuarioId = query.usuarioId;

      if (query.fechaDesde || query.fechaHasta) {
        where.fechaCreacion = {};
        if (query.fechaDesde) where.fechaCreacion.gte = query.fechaDesde;
        if (query.fechaHasta) where.fechaCreacion.lte = query.fechaHasta;
      }

      const [data, total] = await Promise.all([
        this.prisma.auditoriaLog.findMany({
          where,
          orderBy: { fechaCreacion: 'desc' },
          take: query.limite || 50,
          skip: query.offset || 0,
        }),
        this.prisma.auditoriaLog.count({ where }),
      ]);

      return {
        data, // ← Retorna tipos Prisma directamente
        total,
      };
    } catch (error: unknown) {
      const errorEntry =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(errorEntry, {
        context: 'AuditoriaService.buscar',
        query,
      });
      throw errorEntry;
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  async obtenerEstadisticas(
    fechaDesde?: Date,
    fechaHasta?: Date,
  ): Promise<AuditoriaStats> {
    try {
      const where: Prisma.AuditoriaLogWhereInput = {};

      if (fechaDesde || fechaHasta) {
        where.fechaCreacion = {};
        if (fechaDesde) where.fechaCreacion.gte = fechaDesde;
        if (fechaHasta) where.fechaCreacion.lte = fechaHasta;
      }

      const [
        totalRegistros,
        registrosPorAccion,
        registrosPorTabla,
        usuariosActivos,
      ] = await Promise.all([
        this.prisma.auditoriaLog.count({ where }),
        this.prisma.auditoriaLog.groupBy({
          by: ['accion'],
          where,
          _count: { accion: true },
        }),
        this.prisma.auditoriaLog.groupBy({
          by: ['tabla'],
          where,
          _count: { tabla: true },
        }),
        this.prisma.auditoriaLog.findMany({
          where: { ...where, usuarioId: { not: null } },
          select: { usuarioId: true },
          distinct: ['usuarioId'],
        }),
      ]);

      const stats: AuditoriaStats = {
        totalRegistros,
        registrosPorAccion: registrosPorAccion.reduce(
          (acc, item) => {
            acc[item.accion as AuditoriaAction] = item._count.accion;
            return acc;
          },
          {} as Record<AuditoriaAction, number>,
        ),
        registrosPorTabla: registrosPorTabla.reduce(
          (acc, item) => {
            acc[item.tabla] = item._count.tabla;
            return acc;
          },
          {} as Record<string, number>,
        ),
        usuariosActivos: usuariosActivos.length,
      };

      return stats;
    } catch (error: unknown) {
      const errorEntry =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(errorEntry, {
        context: 'AuditoriaService.obtenerEstadisticas',
      });
      throw errorEntry;
    }
  }

  /**
   * Busca por ID de registro específico
   */
  async buscarPorId(id: number): Promise<AuditoriaLog | null> {
    try {
      const log = await this.prisma.auditoriaLog.findUnique({
        where: { id },
      });

      return log || null; // ← Retorna tipo Prisma directamente
    } catch (error: unknown) {
      const errorEntry =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(errorEntry, {
        context: 'AuditoriaService.buscarPorId',
        id,
      });
      throw errorEntry;
    }
  }

  /**
   * Busca historial de un registro específico
   */
  async buscarHistorial(
    tabla: string,
    idRegistro: string,
  ): Promise<AuditoriaLog[]> {
    try {
      const logs = await this.prisma.auditoriaLog.findMany({
        where: {
          tabla,
          idRegistro,
        },
        orderBy: { fechaCreacion: 'desc' },
      });

      return logs; // ← Retorna tipos Prisma directamente
    } catch (error: unknown) {
      const errorEntry =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(errorEntry, {
        context: 'AuditoriaService.buscarHistorial',
        tabla,
        idRegistro,
      });
      throw error;
    }
  }

  /**
   * Limpia registros antiguos de auditoría
   */
  async limpiarRegistrosAntiguos(diasRetencion: number = 365): Promise<number> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasRetencion);

      const result = await this.prisma.auditoriaLog.deleteMany({
        where: {
          fechaCreacion: {
            lt: fechaLimite,
          },
        },
      });

      this.logger.log(
        `Limpieza de auditoría completada: ${result.count} registros eliminados`,
        {
          context: 'AuditoriaService.limpiarRegistrosAntiguos',
          diasRetencion,
          fechaLimite,
          registrosEliminados: result.count,
        },
      );

      return result.count;
    } catch (error: unknown) {
      const errorEntry =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(errorEntry, {
        context: 'AuditoriaService.limpiarRegistrosAntiguos',
        diasRetencion,
      });
      throw errorEntry;
    }
  }

  /**
   * Sanitiza datos sensibles del registro de auditoría
   */
  private sanitizeAuditEntry(entry: AuditoriaEntry): AuditoriaEntry {
    const sanitized = { ...entry };

    if (sanitized.valoresAnteriores) {
      sanitized.valoresAnteriores = AuditoriaUtils.sanitizeObject(
        sanitized.valoresAnteriores,
      );
    }

    if (sanitized.valoresNuevos) {
      sanitized.valoresNuevos = AuditoriaUtils.sanitizeObject(
        sanitized.valoresNuevos,
      );
    }

    return sanitized;
  }

  /**
   * Extrae metadatos del contexto de ejecución (HTTP requests)
   */
  extractMetadata(context: ExecutionContext): AuditoriaMetadata {
    const request = context?.switchToHttp?.()?.getRequest<RequestWithUser>();

    return {
      userId: request?.user?.id,
      ip: request?.ip,
      userAgent: request?.get?.('User-Agent'),
      correlationId: request?.headers?.['x-correlation-id'],
      timestamp: new Date(),
      origen: 'http',
    };
  }

  /**
   * Extrae metadatos para operaciones con usuario conocido
   * Uso: imports, operaciones manuales, scripts con usuario
   */
  extractMetadataFromUser(
    userId: number,
    extraData: Partial<AuditoriaMetadata> = {},
  ): AuditoriaMetadata {
    return {
      userId,
      timestamp: new Date(),
      origen: 'manual',
      ...extraData,
    };
  }

  /**
   * Extrae metadatos para procesos automáticos del sistema
   * Uso: cron jobs, workers, ajustes automáticos
   */
  extractMetadataFromSystem(
    origen: string,
    extraData: Partial<AuditoriaMetadata> = {},
  ): AuditoriaMetadata {
    return {
      timestamp: new Date(),
      origen,
      isSystemGenerated: true,
      ...extraData,
    };
  }
}
