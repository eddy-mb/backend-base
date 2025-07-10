/**
 * Interfaces para el sistema de logging centralizado
 */

export interface LogContext {
  context?: string;
  correlationId?: string | string[];
  userId?: number;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface WinstonConfig {
  level: string;
  format: 'json' | 'simple';
  enableConsole: boolean;
  enableFile: boolean;
  enableErrorFile: boolean;
  logDirectory: string;
  maxFiles: string;
  maxSize: string;
  datePattern: string;
}
