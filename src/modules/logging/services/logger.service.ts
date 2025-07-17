import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import {
  ILoggerService,
  LogMetadata,
  WinstonConfiguration,
  WinstonLogMetadata,
} from '../interfaces/logger.interface';
import {
  LOG_COLORS,
  DEFAULT_LOG_CONFIG,
  TIMESTAMP_FORMAT,
  FILE_ROTATION_CONFIG,
  LOG_LIMITS,
  LogLevel,
} from '../constants/log-levels.constants';

/**
 * LoggerService - Sistema de logging estructurado con Winston
 *
 * Características:
 * - Configuración automática usando Módulo 1
 * - API compatible con Logger de NestJS
 * - Transports automáticos por ambiente
 * - Metadatos enriquecidos
 * - Rotación automática de archivos
 * - Lifecycle management completo
 */
@Injectable()
export class LoggerService
  implements ILoggerService, OnModuleInit, OnModuleDestroy
{
  private logger: winston.Logger;
  private config: WinstonConfiguration;
  private readonly nestLogger = new Logger(LoggerService.name);

  constructor(private readonly configuracionService: ConfiguracionService) {}

  /**
   * Inicialización del módulo - Configura Winston
   */
  onModuleInit(): void {
    try {
      // Obtener configuración validada del Módulo 1
      this.config = this.configuracionService.logging;

      // Configurar Winston con la configuración validada
      this.initializeWinston();

      this.logger.info('Winston configurado y operativo', {
        currentLevel: this.config.level, // ← Cambiar nombre para que aparezca
        enableConsole: this.config.enableConsoleLogging,
        enableFile: this.config.enableFileLogging,
        logDirectory: this.config.logDirectory,
      });
    } catch (error) {
      const { stack } = this.handleError(error);
      this.nestLogger.error('Error inicializando LoggerService', stack);
      throw error;
    }
  }

  /**
   * Destrucción del módulo - Limpia recursos
   */
  async onModuleDestroy(): Promise<void> {
    try {
      if (this.logger) {
        // Cerrar todos los transports de forma segura
        await new Promise<void>((resolve) => {
          this.logger.end(() => {
            this.nestLogger.log('Winston cerrado correctamente');
            resolve();
          });
        });
      }
    } catch (error) {
      const { stack } = this.handleError(error);
      this.nestLogger.error('Error cerrando LoggerService', stack);
    }
  }

  /**
   * Configuración inicial de Winston
   */
  private initializeWinston(): void {
    const transports = this.createTransports();

    this.logger = winston.createLogger({
      level: this.config.level || DEFAULT_LOG_CONFIG.level,
      levels: winston.config.npm.levels,
      transports,
      exitOnError: false,
      // Formateo por defecto para todos los transports
      format: winston.format.combine(
        winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
        winston.format.errors({ stack: true }),
        winston.format.metadata({
          fillExcept: ['message', 'level', 'timestamp'],
        }),
      ),
    });

    // Configurar colores para Winston
    winston.addColors(LOG_COLORS);
  }

  /**
   * Crear transports según configuración y ambiente
   */
  private createTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Transport de Console (desarrollo)
    if (this.config.enableConsoleLogging) {
      transports.push(this.createConsoleTransport());
    }

    // Transports de Archivo (producción)
    if (this.config.enableFileLogging) {
      transports.push(...this.createFileTransports());
    }

    return transports;
  }

  /**
   * Transport de console para desarrollo
   */
  private createConsoleTransport(): winston.transport {
    return new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
          ({ timestamp, level, message, context, metadata }) => {
            // Type-safe conversion para todos los valores de Winston
            const safeTimestamp = LoggerService.safeStringify(timestamp);
            const safeLevel = LoggerService.safeStringify(level);
            const safeMessage = LoggerService.safeStringify(message);
            const ctx = context
              ? `[${LoggerService.safeStringify(context)}]`
              : '';

            // Type-safe handling de metadata
            let meta = '';
            if (
              metadata &&
              typeof metadata === 'object' &&
              Object.keys(metadata).length > 0
            ) {
              try {
                meta = ` ${JSON.stringify(metadata, null, 2)}`;
              } catch {
                meta = ' [Metadata serialization failed]';
              }
            }

            return `${safeTimestamp} ${safeLevel} ${ctx} ${safeMessage}${meta}`;
          },
        ),
      ),
    });
  }

  /**
   * Transports de archivo para producción
   */
  private createFileTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    // Combined log file
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: `${this.config.logDirectory}/combined-%DATE%.log`,
        datePattern: this.config.datePattern,
        maxSize: this.config.maxSize,
        maxFiles: this.config.maxFiles,
        ...FILE_ROTATION_CONFIG,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    );

    // Error log file separado (opcional)
    if (this.config.enableErrorFile) {
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: `${this.config.logDirectory}/error-%DATE%.log`,
          datePattern: this.config.datePattern,
          maxSize: this.config.maxSize,
          maxFiles: this.config.maxFiles,
          level: 'error',
          ...FILE_ROTATION_CONFIG,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      );
    }

    return transports;
  }

  // ==========================================
  // API COMPATIBLE CON LOGGER DE NESTJS
  // ==========================================

  /**
   * Log general - compatible con NestJS Logger
   */
  log(message: string, context?: string): void {
    this.writeLog('info', message, undefined, context);
  }

  /**
   * Log de error - compatible con NestJS Logger
   */
  error(message: string, trace?: string, context?: string): void {
    this.writeLog('error', message, { stack: trace }, context);
  }

  /**
   * Log de advertencia - compatible con NestJS Logger
   */
  warn(message: string, context?: string): void {
    this.writeLog('warn', message, undefined, context);
  }

  /**
   * Log de debug - compatible con NestJS Logger
   */
  debug(message: string, context?: string): void {
    this.writeLog('debug', message, undefined, context);
  }

  /**
   * Log verbose - compatible con NestJS Logger
   */
  verbose(message: string, context?: string): void {
    this.writeLog('verbose', message, undefined, context);
  }

  // ==========================================
  // MÉTODOS EXTENDIDOS CON METADATOS
  // ==========================================

  /**
   * Log con metadatos enriquecidos
   */
  logWithMeta(message: string, meta: LogMetadata, context?: string): void {
    this.writeLog('info', message, meta, context);
  }

  /**
   * Error con metadatos enriquecidos
   */
  errorWithMeta(message: string, meta: LogMetadata, context?: string): void {
    this.writeLog('error', message, meta, context);
  }

  /**
   * Advertencia con metadatos enriquecidos
   */
  warnWithMeta(message: string, meta: LogMetadata, context?: string): void {
    this.writeLog('warn', message, meta, context);
  }

  /**
   * Debug con metadatos enriquecidos
   */
  debugWithMeta(message: string, meta: LogMetadata, context?: string): void {
    this.writeLog('debug', message, meta, context);
  }

  // ==========================================
  // MÉTODOS UTILITARIOS
  // ==========================================

  /**
   * Manejar errores de forma type-safe
   */
  private handleError(error: unknown): { message: string; stack?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      message: typeof error === 'string' ? error : 'Error desconocido',
      stack: undefined,
    };
  }

  /**
   * Sanitizar un valor individual de forma type-safe
   */
  private static sanitizeValue(value: unknown): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (typeof value === 'object') {
      try {
        const jsonString = JSON.stringify(value);
        if (jsonString.length > LOG_LIMITS.maxMetadataSize) {
          return '[Object too large]';
        }
        return value;
      } catch {
        return '[Object serialization failed]';
      }
    }

    if (typeof value === 'function') {
      return '[Function]';
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    // Fallback seguro para tipos desconocidos sin usar String()
    return '[Unknown type]';
  }

  /**
   * Convertir valor a string de forma segura (para template literals)
   */
  private static safeStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'symbol') {
      return value.toString();
    }

    if (typeof value === 'function') {
      return '[Function]';
    }

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[Complex Object]';
      }
    }

    // Fallback seguro para tipos desconocidos
    return '[Unknown Type]';
  }

  /**
   * Método interno para escribir logs
   */
  private writeLog(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    context?: string,
  ): void {
    if (!this.logger) {
      // Fallback a console si Winston no está disponible
      console.log(`[${level.toUpperCase()}] ${context || ''} ${message}`);
      return;
    }

    try {
      // Sanitizar mensaje
      const sanitizedMessage = this.sanitizeMessage(message);

      // Preparar metadatos
      const logMetadata = this.prepareMetadata(metadata, context);

      // Escribir log
      this.logger.log(level, sanitizedMessage, logMetadata);
    } catch (error) {
      // Fallback en caso de error - usar handleError para type safety
      const { message: errorMsg } = this.handleError(error);
      console.error('Error writing log:', errorMsg);
      console.log(`[${level.toUpperCase()}] ${context || ''} ${message}`);
    }
  }

  /**
   * Sanitizar mensaje de log
   */
  private sanitizeMessage(message: string): string {
    // Asegurar que el mensaje sea string
    let sanitizedMessage: string;

    if (typeof message === 'string') {
      sanitizedMessage = message;
    } else {
      // Type-safe conversion para no-string values
      sanitizedMessage = LoggerService.safeStringify(message);
    }

    // Truncar mensaje si es muy largo
    if (sanitizedMessage.length > LOG_LIMITS.maxMessageLength) {
      sanitizedMessage =
        sanitizedMessage.substring(0, LOG_LIMITS.maxMessageLength) + '...';
    }

    return sanitizedMessage.trim();
  }

  /**
   * Preparar metadatos para log
   */
  private prepareMetadata(
    metadata?: LogMetadata,
    context?: string,
  ): WinstonLogMetadata {
    const logMeta: WinstonLogMetadata = {
      timestamp: new Date().toISOString(),
    };

    // Agregar contexto si existe
    if (context) {
      logMeta.context = context;
    }

    // Agregar metadatos si existen
    if (metadata) {
      // Sanitizar y limitar tamaño de metadatos
      const sanitizedMeta = this.sanitizeMetadata(metadata);
      Object.assign(logMeta, sanitizedMeta);
    }

    return logMeta;
  }

  /**
   * Sanitizar metadatos
   */
  private sanitizeMetadata(metadata: LogMetadata): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // LoggerService.sanitizeValue siempre retorna un valor seguro para logging
      // El tipo 'any' es apropiado aqui ya que los metadatos pueden ser de cualquier tipo
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      sanitized[key] = LoggerService.sanitizeValue(value);
    }

    return sanitized;
  }

  /**
   * Verificar si Winston está configurado
   */
  isConfigured(): boolean {
    return !!this.logger;
  }

  /**
   * Obtener configuración actual
   */
  getConfiguration(): WinstonConfiguration {
    return { ...this.config };
  }

  /**
   * Forzar flush de logs pendientes
   */
  async flush(): Promise<void> {
    if (this.logger) {
      return new Promise<void>((resolve) => {
        this.logger.on('finish', resolve);
        this.logger.end();
      });
    }
  }
}
