import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Módulos requeridos
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { DatabaseModule } from '../database/database.module';

// Servicios
import { LoggerService } from './services/logger.service';
import { AuditoriaService } from './services/auditoria.service';

// Interceptores
import { AuditoriaInterceptor } from './interceptors/auditoria.interceptor';

/**
 * Módulo 5: Observabilidad
 *
 * Proporciona:
 * - LoggerService: Winston configurado via Módulo 1
 * - AuditoriaService: Gestión de logs de auditoría
 * - @Auditable(): Decorador para auditoría automática
 * - AuditoriaInterceptor: Interceptor global automático
 *
 * Dependencias:
 * - Módulo 1: Configuración (para configuración Winston validada)
 * - Módulo 2: Base de Datos (para tabla auditoria_logs)
 *
 * Uso:
 * ```typescript
 * // En cualquier servicio
 * constructor(private logger: LoggerService) {}
 *
 * // En cualquier controller
 * @Post()
 * @Auditable({ includeNewValues: true })
 * async crear(@Body() datos: CreateDto) {
 *   this.logger.log('Creando registro', { context: 'MiController' });
 *   return this.service.crear(datos);
 * }
 * ```
 */
@Global()
@Module({
  imports: [
    ConfiguracionModule, // Para configuración Winston validada
    DatabaseModule, // Para PrismaService y tabla auditoria_logs
  ],
  providers: [
    LoggerService,
    AuditoriaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditoriaInterceptor,
    },
  ],
  exports: [LoggerService, AuditoriaService],
})
export class ObservabilidadModule {}
