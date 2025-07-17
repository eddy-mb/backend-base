import { Global, Module } from '@nestjs/common';
import { LoggerService } from './services/logger.service';

/**
 * LoggingModule - Módulo de Logging Estructurado
 *
 * Características:
 * - Global para disponibilidad en toda la aplicación
 * - Reutiliza configuración validada del Módulo 1
 * - LoggerService compatible con Logger de NestJS
 * - Configuración automática de Winston por ambiente
 * - Sin dependencias adicionales (ConfiguracionService es @Global)
 *
 * Uso:
 * - Inyectar LoggerService en servicios que requieran logging estructurado
 * - API compatible permite migración gradual desde Logger de NestJS
 * - Métodos extendidos para logging con metadatos enriquecidos
 *
 * Dependencias:
 * - Módulo 1: ConfiguracionService (automático por @Global)
 * - Winston: winston, winston-daily-rotate-file
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggingModule {}
