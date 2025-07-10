/**
 * Constantes para acciones de auditoría
 */

export const AUDITORIA_DECORATOR_KEY = 'auditoria_config';

export const DEFAULT_AUDITORIA_CONFIG = {
  includeOldValues: true,
  includeNewValues: true,
  skipFields: ['password', 'token', 'secret'],
} as const;

export const AUDIT_SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'credential',
  'auth',
  'authorization',
  'private',
  'hash',
  'salt',
] as const;

export const MAX_AUDIT_RETENTION_DAYS = 365; // 1 año por defecto
