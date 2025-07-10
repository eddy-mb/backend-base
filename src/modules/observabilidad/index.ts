// Servicios
export { LoggerService } from './services/logger.service';
export { AuditoriaService } from './services/auditoria.service';

// Decoradores
export {
  Auditable,
  AuditableCreate,
  AuditableUpdate,
  AuditableDelete,
  AuditableRead,
} from './decorators/auditable.decorator';

// Interceptores
export { AuditoriaInterceptor } from './interceptors/auditoria.interceptor';

// Interfaces
export * from './interfaces/logging.interface';
export * from './interfaces/auditoria.interface';
export * from './interfaces/interceptor.interface';

// Utilidades
export { AuditoriaUtils } from './utils/auditoria.utils';

// Tipos Prisma (re-exportación para conveniencia)
export type { AuditoriaLog } from '@prisma/client';

// DTOs
export {
  CreateAuditoriaLogDto,
  AuditoriaResponseDto,
} from './dto/create-auditoria-log.dto';
export { AuditoriaQueryDto } from './dto/auditoria-query.dto';

// Constantes
export * from './constants/log-levels.constants';
export * from './constants/auditoria-actions.constants';

// Módulo
export { ObservabilidadModule } from './observabilidad.module';
