import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import {
  createLogger,
  Logger as WinstonLogger,
  format,
  transports,
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response } from 'express';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { LogContext, WinstonConfig } from '../interfaces/logging.interface';
import {
  LOG_LEVELS,
  SENSITIVE_FIELDS,
} from '../constants/log-levels.constants';

/**
 * Servicio de logging centralizado usando Winston
 * Configurado automáticamente via ConfiguracionService (Módulo 1)
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: WinstonLogger;
  private readonly config: WinstonConfig;

  constructor(private configuracionService: ConfiguracionService) {
    this.config = this.buildWinstonConfig();
    this.logger = this.createWinstonLogger();
  }

  /**
   * Construye la configuración de Winston desde ConfiguracionService
   */
  private buildWinstonConfig(): WinstonConfig {
    const loggingConfig = this.configuracionService.logging;

    return {
      level: loggingConfig.level,
      format: loggingConfig.format,
      enableConsole: loggingConfig.enableConsoleLogging,
      enableFile: loggingConfig.enableFileLogging,
      enableErrorFile: loggingConfig.enableErrorFile,
      logDirectory: loggingConfig.logDirectory,
      maxFiles: loggingConfig.maxFiles,
      maxSize: loggingConfig.maxSize,
      datePattern: loggingConfig.datePattern,
    };
  }

  /**
   * Crea la instancia de Winston con configuración validada
   */
  private createWinstonLogger(): WinstonLogger {
    const logTransports: any[] = [];

    // Console transport (desarrollo)
    if (this.config.enableConsole) {
      logTransports.push(
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            format.printf(({ level, message, timestamp, context, ...meta }) => {
              const contextStr = context
                ? `[${typeof context === 'string' ? context : JSON.stringify(context)}] `
                : '';
              const metaStr = Object.keys(meta).length
                ? ` ${JSON.stringify(meta)}`
                : '';
              return `${String(timestamp)} ${level}: ${contextStr}${String(message)}${metaStr}`;
            }),
          ),
        }),
      );
    }

    // File transport (producción)
    if (this.config.enableFile) {
      logTransports.push(
        new DailyRotateFile({
          filename: `${this.config.logDirectory}/application-%DATE%.log`,
          datePattern: this.config.datePattern,
          maxFiles: this.config.maxFiles,
          maxSize: this.config.maxSize,
          format: format.combine(
            format.timestamp(),
            format.errors({ stack: true }),
            this.config.format === 'json' ? format.json() : format.simple(),
          ),
        }),
      );
    }

    // Error file transport separado
    if (this.config.enableErrorFile) {
      logTransports.push(
        new DailyRotateFile({
          filename: `${this.config.logDirectory}/error-%DATE%.log`,
          datePattern: this.config.datePattern,
          level: 'error',
          maxFiles: this.config.maxFiles,
          maxSize: this.config.maxSize,
          format: format.combine(
            format.timestamp(),
            format.errors({ stack: true }),
            this.config.format === 'json' ? format.json() : format.simple(),
          ),
        }),
      );
    }

    return createLogger({
      level: this.config.level,
      levels: LOG_LEVELS,
      transports: logTransports,
      exitOnError: false,
      defaultMeta: {
        service: this.configuracionService.aplicacion.nombre,
        version: this.configuracionService.aplicacion.version,
        environment: this.configuracionService.aplicacion.ambiente,
      },
    });
  }

  /**
   * Sanitiza datos sensibles antes del logging
   */
  private sanitizeContext(context: LogContext): LogContext {
    if (!context) return {};

    const sanitized = { ...context };

    Object.keys(sanitized).forEach((key) => {
      if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Implementación de NestJS LoggerService interface
  log(message: string, context?: string): void;
  log(message: string, context?: LogContext): void;
  log(message: string, context?: string | LogContext): void {
    const sanitizedContext =
      typeof context === 'string'
        ? { context }
        : this.sanitizeContext(context || {});

    this.logger.info(message, sanitizedContext);
  }

  error(message: string, trace?: string, context?: string): void;
  error(message: string, context?: LogContext): void;
  error(
    message: string,
    traceOrContext?: string | LogContext,
    context?: string,
  ): void {
    let finalContext: LogContext = {};
    let trace: string | undefined;

    if (typeof traceOrContext === 'string') {
      trace = traceOrContext;
      finalContext = context ? { context } : {};
    } else {
      finalContext = traceOrContext || {};
    }

    const sanitizedContext = this.sanitizeContext(finalContext);

    if (trace) {
      sanitizedContext.stack = trace;
    }

    this.logger.error(message, sanitizedContext);
  }

  warn(message: string, context?: string): void;
  warn(message: string, context?: LogContext): void;
  warn(message: string, context?: string | LogContext): void {
    const sanitizedContext =
      typeof context === 'string'
        ? { context }
        : this.sanitizeContext(context || {});

    this.logger.warn(message, sanitizedContext);
  }

  debug(message: string, context?: string | LogContext): void {
    const sanitizedContext =
      typeof context === 'string'
        ? { context }
        : this.sanitizeContext(context || {});

    this.logger.debug(message, sanitizedContext);
  }

  verbose(message: string, context?: string | LogContext): void {
    // Winston no tiene verbose, mapeamos a debug
    this.debug(message, context);
  }

  // Métodos adicionales para funcionalidad extendida

  /**
   * Log con nivel personalizado
   */
  logWithLevel(level: string, message: string, context?: LogContext): void {
    const sanitizedContext = this.sanitizeContext(context || {});
    this.logger.log(level, message, sanitizedContext);
  }

  /**
   * Log de operación HTTP
   */
  logHttp(req: Request, res: Response, responseTime: number): void {
    const context: LogContext = {
      context: 'HTTP',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      correlationId: req.headers['x-correlation-id'],
    };

    const message = `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;

    if (res.statusCode >= 400) {
      this.error(message, context);
    } else {
      this.log(message, context);
    }
  }

  /**
   * Log de error con stack trace completo
   */
  logError(error: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...this.sanitizeContext(context || {}),
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    };

    this.error(`Error: ${error.message}`, errorContext);
  }

  /**
   * Log de auditoría específico
   */
  logAudit(message: string, context: LogContext): void {
    const auditContext: LogContext = {
      ...this.sanitizeContext(context),
      context: 'AUDIT',
      timestamp: new Date().toISOString(),
    };

    this.log(message, auditContext);
  }

  /**
   * Obtiene la configuración actual de Winston
   */
  getConfig(): WinstonConfig {
    return { ...this.config };
  }

  /**
   * Verifica si un nivel de log está habilitado
   */
  isLevelEnabled(level: string): boolean {
    return this.logger.isLevelEnabled(level);
  }
}
