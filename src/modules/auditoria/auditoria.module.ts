import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Entidades
import { AuditoriaLog } from './entities/auditoria-log.entity';

// Repositories
import { AuditoriaRepository } from './repositories/auditoria.repository';

// Servicios
import { AuditoriaService } from './services/auditoria.service';

// Controladores
import { AuditoriaController } from './controllers/auditoria.controller';

// Interceptores
import { AuditoriaInterceptor } from './interceptors/auditoria.interceptor';

// Dependencias de otros módulos
import { LoggingModule } from '../logging/logging.module';

/**
 * Módulo de Auditoría Simplificado
 *
 * Proporciona trazabilidad automática con arquitectura limpia:
 * - Repository Pattern para separación de responsabilidades
 * - Servicio enfocado en lógica de negocio
 * - Controlador minimalista integrado con módulo de respuestas
 * - Interceptor automático para auditoría transparente
 */
@Module({
  imports: [
    // TypeORM para la entidad AuditoriaLog
    TypeOrmModule.forFeature([AuditoriaLog]),

    // LoggingModule para logging técnico
    LoggingModule,
  ],

  providers: [
    // Repository para operaciones de BD
    AuditoriaRepository,

    // Servicio principal de auditoría
    AuditoriaService,

    // Interceptor global para captura automática
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],

  controllers: [
    // Controlador simplificado para consultas
    AuditoriaController,
  ],

  exports: [
    // Exportar servicio para uso directo
    AuditoriaService,

    // Exportar repository para casos avanzados
    AuditoriaRepository,
  ],
})
export class AuditoriaModule {}
