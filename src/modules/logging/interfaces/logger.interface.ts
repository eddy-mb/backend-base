/**
 * Interfaz principal del LoggerService compatible con Logger de NestJS
 * Proporciona métodos básicos y extendidos con metadatos
 */
export interface ILoggerService {
  // API compatible con Logger de NestJS
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
  debug(message: string, context?: string): void;
  verbose(message: string, context?: string): void;

  // Métodos extendidos con metadatos
  logWithMeta(message: string, meta: LogMetadata, context?: string): void;
  errorWithMeta(message: string, meta: LogMetadata, context?: string): void;
  warnWithMeta(message: string, meta: LogMetadata, context?: string): void;
  debugWithMeta(message: string, meta: LogMetadata, context?: string): void;
}

/**
 * Metadatos adicionales para logging enriquecido
 */
export interface LogMetadata {
  [key: string]: any;
  correlationId?: string;
  userId?: number;
  module?: string;
  method?: string;
  duration?: number;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

/**
 * Metadatos preparados para Winston
 */
export interface WinstonLogMetadata {
  timestamp: string;
  context?: string;
  [key: string]: any;
}

/**
 * Configuración Winston reutilizada del Módulo 1
 * NO SE DEFINE AQUÍ - Se obtiene del ConfiguracionService
 */
export interface WinstonConfiguration {
  level: string;
  maxFiles: string;
  maxSize: string;
  logDirectory: string;
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  datePattern: string;
  enableErrorFile: boolean;
  format: 'json' | 'simple';
}
