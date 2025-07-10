/**
 * Constantes para niveles de log de Winston
 */

export const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

export const DEFAULT_LOG_CONTEXT = 'Application';

export const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'auth',
  'credential',
  'private',
] as const;

export const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
} as const;
