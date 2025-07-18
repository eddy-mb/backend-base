/**
 * Exportaciones del Módulo de Auditoría
 */

// Módulo principal
export * from './auditoria.module';

// Entidades
export * from './entities/auditoria-log.entity';

// Servicios
export * from './services/auditoria.service';

// Repositories
export * from './repositories/auditoria.repository';

// Controladores
export * from './controllers/auditoria.controller';

// Decoradores (funcionalidad principal)
export * from './decorators/auditable.decorator';

// Interceptores
export * from './interceptors/auditoria.interceptor';

// DTOs
export * from './dto/auditoria.dto';

// Interfaces
export * from './interfaces/auditoria.interface';

// Constantes
export * from './constants/auditoria.constants';
