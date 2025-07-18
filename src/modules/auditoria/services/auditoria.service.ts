import { Injectable } from '@nestjs/common';
import { CreateAuditoriaDto, AuditoriaQueryDto } from '../dto/auditoria.dto';
import { AuditoriaRepository } from '../repositories/auditoria.repository';
import { AuditoriaLog } from '../entities/auditoria-log.entity';
import { LoggerService } from '@/modules/logging';

/**
 * Servicio de auditoría simplificado
 *
 * Solo contiene lógica de negocio, delegando operaciones de BD al repository
 */
@Injectable()
export class AuditoriaService {
  // private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    private auditoriaRepository: AuditoriaRepository,
    private logger: LoggerService,
  ) {}

  /**
   * Crea un nuevo registro de auditoría
   */
  async registrarAuditoria(datos: CreateAuditoriaDto): Promise<AuditoriaLog> {
    try {
      // Extraer campos calculados de metadatos
      const correlationId = datos.metadatos?.request?.correlationId;
      const ipOrigen = datos.metadatos?.request?.ip;

      const resultado = await this.auditoriaRepository.crear({
        ...datos,
        correlationId,
        ipOrigen,
      });

      return resultado;
    } catch (error) {
      this.logger.log('Error al registrar auditoría', 'AuditoriaService');
      throw error;
    }
  }

  /**
   * Busca logs de auditoría con filtros y paginación
   */
  async buscar(query: AuditoriaQueryDto): Promise<[AuditoriaLog[], number]> {
    try {
      return await this.auditoriaRepository.buscarConFiltros(query);
    } catch (error) {
      this.logger.error(
        'Error al buscar logs de auditoría',
        'AuditoriaService',
      );
      throw error;
    }
  }
}
