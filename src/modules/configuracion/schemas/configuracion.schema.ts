import { z } from 'zod';

// Esquema para Base de Datos
export const esquemaBaseDatos = z.object({
  // Variables separadas (recomendado)
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().min(1, 'Usuario de base de datos requerido'),
  DB_PASSWORD: z.string().min(1, 'Contraseña de base de datos requerida'),
  DB_NAME: z.string().min(1, 'Nombre de base de datos requerido'),
  DB_SSL: z.boolean().default(false),

  // DATABASE_URL (para compatibilidad con Prisma)
  DATABASE_URL: z.string().url('URL de base de datos inválida'),

  // Redis separado
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.number().int().min(1).max(65535).default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.string().url('URL de Redis inválida').optional(),
});

// Esquema para Aplicación
export const esquemaAplicacion = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.number().int().min(1000).max(65535).default(3001),
  APP_NAME: z.string().min(1).default('Sistema Base Individual'),
  APP_VERSION: z.string().default('1.0.0'),
  FRONTEND_URL: z.string().url('URL de frontend inválida'),
  API_URL: z.string().url('URL de API inválida'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  TZ: z.string().default('America/La_Paz'),
});

// Esquema para Seguridad
export const esquemaSeguridad = z.object({
  JWT_SECRET: z
    .string()
    .min(32, 'JWT Secret debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z
    .string()
    .min(32, 'Encryption Key debe tener al menos 32 caracteres'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.number().int().min(1).default(100),
  RATE_LIMIT_WINDOW_MS: z.number().int().min(1000).default(900000),
});

// Esquema para Winston/Logging
export const esquemaWinston = z.object({
  WINSTON_MAX_FILES: z.string().default('14d'),
  WINSTON_MAX_SIZE: z.string().default('20m'),
  WINSTON_LOG_DIR: z.string().default('./logs'),
  WINSTON_CONSOLE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
  WINSTON_FILE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  WINSTON_DATE_PATTERN: z.string().default('YYYY-MM-DD'),
  WINSTON_ERROR_FILE_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),
});

// Esquema para Servicios Externos
export const esquemaServiciosExternos = z.object({
  // Email
  EMAIL_PROVIDER: z.enum(['resend', 'smtp']).default('resend'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // SMTP (alternativo)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.number().int().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_PATH: z.string().default('./uploads'),

  // S3 (si se usa)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

// Esquema principal combinado
export const esquemaConfiguracion = z.object({
  ...esquemaBaseDatos.shape,
  ...esquemaAplicacion.shape,
  ...esquemaSeguridad.shape,
  ...esquemaWinston.shape,
  ...esquemaServiciosExternos.shape,
});

export type ConfiguracionSistema = z.infer<typeof esquemaConfiguracion>;
export type ConfiguracionBaseDatos = z.infer<typeof esquemaBaseDatos>;
export type ConfiguracionAplicacion = z.infer<typeof esquemaAplicacion>;
export type ConfiguracionSeguridad = z.infer<typeof esquemaSeguridad>;
export type ConfiguracionWinston = z.infer<typeof esquemaWinston>;
export type ConfiguracionServiciosExternos = z.infer<
  typeof esquemaServiciosExternos
>;
