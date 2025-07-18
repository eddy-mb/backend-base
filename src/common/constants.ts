/**
 * Configuración por defecto para consultas
 */

export const QUERY_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  ORDER_BY: 'fechaCreacion',
  ORDER_DIRECTION: 'DESC',
} as const;
