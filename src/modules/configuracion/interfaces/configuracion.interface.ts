/**
 * Interfaces para el módulo de configuración del sistema
 * Actualizadas para trabajar con ResponseModule (formato { data: ... })
 */

export interface ConfiguracionBaseDatos {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  url: string; // Para compatibilidad con Prisma
}

export interface ConfiguracionRedis {
  url?: string;
  host: string;
  port: number;
  password?: string;
}

export interface ConfiguracionAplicacion {
  nombre: string;
  version: string;
  ambiente: string;
  puerto: number;
  frontendUrl: string;
  apiUrl: string;
  logLevel: string;
  timeZone: string;
}

export interface ConfiguracionSeguridad {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret?: string;
  jwtRefreshExpiresIn: string;
  encryptionKey: string;
  corsOrigin: string;
  rateLimitMax: number;
  rateLimitWindow: number;
}

export interface ConfiguracionEmail {
  provider: 'resend' | 'smtp';
  resendApiKey?: string;
  emailFrom?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

export interface ConfiguracionStorage {
  provider: 'local' | 's3';
  storagePath?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsS3Bucket?: string;
}

export interface EstadoSistema {
  sistemaOperativo: boolean;
  servicios: {
    baseDatos: 'conectado' | 'desconectado';
    redis: 'conectado' | 'desconectado';
    email: 'operativo' | 'inoperativo';
  };
}

// Interfaces de datos para endpoints (ResponseModule agrega wrapper { data: ... } automáticamente)
export interface DatosSaludSistema {
  sistema: 'operativo' | 'degradado' | 'inoperativo';
  version: string;
  ambiente: string;
  timestamp: string;
  servicios: {
    baseDatos: 'conectado' | 'desconectado';
    redis: 'conectado' | 'desconectado';
    email: 'operativo' | 'inoperativo';
  };
}

export interface ConfiguracionPublica {
  aplicacion: {
    nombre: string;
    version: string;
    ambiente: string;
  };
  caracteristicas: {
    email: boolean;
    storage: 'local' | 's3';
    redis: boolean;
  };
  limites: {
    rateLimitMax: number;
    rateLimitWindow: number;
  };
  baseDatos: {
    host: string;
    port: number;
    database: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
  };
}

export interface ValidacionConfiguracion {
  valida: boolean;
  errores: string[];
  advertencias: string[];
}

export interface DatosConectividad {
  baseDatos: boolean;
  redis: boolean;
  email: boolean;
}

export interface DatosInfoSistema {
  nombre: string;
  version: string;
  ambiente: string;
  timestamp: string;
}
