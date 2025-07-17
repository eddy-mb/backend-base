/**
 * Niveles de log permitidos por Winston
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
} as const;

/**
 * Colores para logs en desarrollo
 */
export const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'cyan',
} as const;

/**
 * Configuración por defecto para Winston
 */
export const DEFAULT_LOG_CONFIG = {
  level: 'info',
  maxFiles: '14d',
  maxSize: '20m',
  logDirectory: './logs',
  enableConsoleLogging: true,
  enableFileLogging: false,
  datePattern: 'YYYY-MM-DD',
  enableErrorFile: true,
  format: 'simple',
} as const;

/**
 * Formato de timestamp para logs
 */
export const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';

/**
 * Configuración de rotación de archivos
 */
export const FILE_ROTATION_CONFIG = {
  frequency: '24h',
  verbose: false,
  createSymlink: true,
  symlinkName: 'current.log',
} as const;

/**
 * Límites de log
 */
export const LOG_LIMITS = {
  maxMessageLength: 2000,
  maxMetadataSize: 10000,
  maxStackTraceLength: 5000,
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];
