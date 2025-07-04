/**
 * Constantes globales del sistema
 */

export const APP_CONFIG = {
  NAME: 'Sistema Base Individual',
  VERSION: '1.0.0',
  DESCRIPTION: 'Infraestructura base agnóstica al dominio',
  API_PREFIX: 'api/v1',
} as const;

export const DEFAULT_CONFIG = {
  PORT: 3001,
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
  RATE_LIMIT_MAX: 100,
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutos
  JWT_EXPIRES_IN: '24h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: 'http://localhost:3000',
} as const;

export const DATABASE_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const ESTADOS_COMUNES = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  PENDIENTE: 'pendiente',
  ARCHIVADO: 'archivado',
} as const;
