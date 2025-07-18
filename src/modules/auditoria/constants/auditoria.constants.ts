/**
 * Constantes esenciales para el módulo de auditoría
 * Solo incluye constantes actualmente usadas en el código
 */

/**
 * Clave para los metadatos del decorador @Auditable
 */
export const AUDITORIA_METADATA_KEY = 'auditoria:options';

/**
 * Mapeo de métodos HTTP a acciones de auditoría (con tipos correctos)
 */
export const HTTP_METHOD_TO_ACTION = {
  POST: 'CREATE' as const,
  PUT: 'UPDATE' as const,
  PATCH: 'UPDATE' as const,
  DELETE: 'DELETE' as const,
} as const;

/**
 * Límites de validación para campos de auditoría
 */
export const AUDITORIA_LIMITS = {
  TABLA_MAX_LENGTH: 100,
  ID_REGISTRO_MAX_LENGTH: 255,
} as const;

/**
 * Headers HTTP para extraer información del request
 */
export const REQUEST_HEADERS = {
  USER_AGENT: 'user-agent',
  X_FORWARDED_FOR: 'x-forwarded-for',
  X_REAL_IP: 'x-real-ip',
  CORRELATION_ID: 'x-correlation-id',
} as const;
