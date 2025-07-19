import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConfiguracionSistema,
  esquemaConfiguracion,
} from '../schemas/configuracion.schema';
import {
  ConfiguracionEmail,
  ConfiguracionStorage,
  ConfiguracionRedis,
  ConfiguracionBaseDatos,
  ConfiguracionAplicacion,
  ConfiguracionSeguridad,
  ConfiguracionLogging,
  ConfiguracionOAuth,
  ConfiguracionPublica,
} from '../interfaces/configuracion.interface';

@Injectable()
export class ConfiguracionService {
  private readonly logger = new Logger(ConfiguracionService.name);
  private configuracion!: ConfiguracionSistema;

  constructor(private configService: ConfigService) {
    // Cargar y validar configuración inmediatamente en el constructor
    this.cargarYValidarConfiguracion();
  }

  private cargarYValidarConfiguracion(): void {
    try {
      // Cargar variables de entorno
      const configRaw = {
        // Base de datos - variables separadas
        DB_HOST: this.configService.get<string>('DB_HOST', 'localhost'),
        DB_PORT: parseInt(this.configService.get('DB_PORT', '5432')),
        DB_USER: this.configService.get<string>('DB_USER'),
        DB_PASSWORD: this.configService.get<string>('DB_PASSWORD'),
        DB_NAME: this.configService.get<string>('DB_NAME'),
        DB_SSL: this.configService.get('DB_SSL', 'false') === 'true',
        DATABASE_URL: this.configService.get<string>('DATABASE_URL'),

        // Configuraciones de conexión TypeORM
        DB_AUTO_LOAD_ENTITIES: this.configService.get<string>(
          'DB_AUTO_LOAD_ENTITIES',
          'true',
        ),
        DB_RETRY_DELAY: parseInt(
          this.configService.get('DB_RETRY_DELAY', '3000'),
        ),
        DB_RETRY_ATTEMPTS: parseInt(
          this.configService.get('DB_RETRY_ATTEMPTS', '3'),
        ),
        DB_CONNECTION_TIMEOUT: parseInt(
          this.configService.get('DB_CONNECTION_TIMEOUT', '60000'),
        ),
        DB_IDLE_TIMEOUT: parseInt(
          this.configService.get('DB_IDLE_TIMEOUT', '600000'),
        ),
        DB_MAX_CONNECTIONS: parseInt(
          this.configService.get('DB_MAX_CONNECTIONS', '20'),
        ),
        DB_MIN_CONNECTIONS: parseInt(
          this.configService.get('DB_MIN_CONNECTIONS', '5'),
        ),

        // Redis - variables separadas
        REDIS_HOST: this.configService.get<string>('REDIS_HOST', 'localhost'),
        REDIS_PORT: parseInt(this.configService.get('REDIS_PORT', '6379')),
        REDIS_PASSWORD: this.configService.get<string>('REDIS_PASSWORD'),
        REDIS_URL: this.configService.get<string>('REDIS_URL'),

        // Aplicación
        NODE_ENV: this.configService.get<string>('NODE_ENV', 'development'),
        PORT: parseInt(this.configService.get('PORT', '3001')),
        APP_NAME: this.configService.get<string>(
          'APP_NAME',
          'Sistema Base Individual',
        ),
        APP_VERSION: this.configService.get<string>('APP_VERSION', '1.0.0'),
        FRONTEND_URL: this.configService.get<string>('FRONTEND_URL'),
        API_URL: this.configService.get<string>('API_URL'),
        LOG_LEVEL: this.configService.get<string>('LOG_LEVEL', 'info'),
        TZ: this.configService.get<string>('TZ', 'America/La_Paz'),

        // Seguridad
        JWT_SECRET: this.configService.get<string>('JWT_SECRET'),
        JWT_EXPIRES_IN: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
        JWT_REFRESH_SECRET:
          this.configService.get<string>('JWT_REFRESH_SECRET'),
        JWT_REFRESH_EXPIRES_IN: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ),
        ENCRYPTION_KEY: this.configService.get<string>('ENCRYPTION_KEY'),
        CORS_ORIGIN: this.configService.get<string>('CORS_ORIGIN', '*'),
        RATE_LIMIT_MAX: parseInt(
          this.configService.get('RATE_LIMIT_MAX', '100'),
        ),
        RATE_LIMIT_WINDOW_MS: parseInt(
          this.configService.get('RATE_LIMIT_WINDOW_MS', '900000'),
        ),

        // Servicios externos
        EMAIL_PROVIDER: this.configService.get<string>(
          'EMAIL_PROVIDER',
          'resend',
        ),
        RESEND_API_KEY: this.configService.get<string>('RESEND_API_KEY'),
        EMAIL_FROM: this.configService.get<string>('EMAIL_FROM'),
        SMTP_HOST: this.configService.get<string>('SMTP_HOST'),
        SMTP_PORT: this.configService.get<string>('SMTP_PORT')
          ? parseInt(this.configService.get<string>('SMTP_PORT')!)
          : undefined,
        SMTP_USER: this.configService.get<string>('SMTP_USER'),
        SMTP_PASSWORD: this.configService.get<string>('SMTP_PASSWORD'),
        STORAGE_PROVIDER: this.configService.get<string>(
          'STORAGE_PROVIDER',
          'local',
        ),
        STORAGE_PATH: this.configService.get<string>(
          'STORAGE_PATH',
          './uploads',
        ),
        AWS_ACCESS_KEY_ID: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        AWS_SECRET_ACCESS_KEY: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
        AWS_REGION: this.configService.get<string>('AWS_REGION'),
        AWS_S3_BUCKET: this.configService.get<string>('AWS_S3_BUCKET'),

        // OAuth - nuevas variables para autenticación
        GOOGLE_CLIENT_ID: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        GOOGLE_CLIENT_SECRET: this.configService.get<string>(
          'GOOGLE_CLIENT_SECRET',
        ),

        // Winston/Logging - variables nuevas
        WINSTON_MAX_FILES: this.configService.get<string>(
          'WINSTON_MAX_FILES',
          '14d',
        ),
        WINSTON_MAX_SIZE: this.configService.get<string>(
          'WINSTON_MAX_SIZE',
          '20m',
        ),
        WINSTON_LOG_DIR: this.configService.get<string>(
          'WINSTON_LOG_DIR',
          './logs',
        ),
        WINSTON_CONSOLE_ENABLED: this.configService.get<string>(
          'WINSTON_CONSOLE_ENABLED',
          'true',
        ),
        WINSTON_FILE_ENABLED: this.configService.get<string>(
          'WINSTON_FILE_ENABLED',
        ),
        WINSTON_DATE_PATTERN: this.configService.get<string>(
          'WINSTON_DATE_PATTERN',
          'YYYY-MM-DD',
        ),
        WINSTON_ERROR_FILE_ENABLED: this.configService.get<string>(
          'WINSTON_ERROR_FILE_ENABLED',
          'true',
        ),
      };

      // Validar con Zod
      const resultado = esquemaConfiguracion.safeParse(configRaw);

      if (!resultado.success) {
        const errores = resultado.error.errors
          .map((err) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');

        throw new Error(`Configuración inválida: ${errores}`);
      }

      this.configuracion = resultado.data;
      this.logger.log('Configuración cargada y validada correctamente');

      // Log de configuración no sensible
      this.logger.debug(`Ambiente: ${this.configuracion.NODE_ENV}`);
      this.logger.debug(`Puerto: ${this.configuracion.PORT}`);
      this.logger.debug(`Log Level: ${this.configuracion.LOG_LEVEL}`);
      this.logger.debug(
        `Base de datos: ${this.configuracion.DB_HOST}:${this.configuracion.DB_PORT}/${this.configuracion.DB_NAME}`,
      );
      this.logger.debug(
        `Redis: ${this.configuracion.REDIS_HOST}:${this.configuracion.REDIS_PORT}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error al cargar configuración:', errorMessage);
      throw error;
    }
  }

  // Getters para acceder a configuraciones específicas
  get baseDatos(): ConfiguracionBaseDatos {
    return {
      host: this.configuracion.DB_HOST,
      port: this.configuracion.DB_PORT,
      user: this.configuracion.DB_USER,
      password: this.configuracion.DB_PASSWORD,
      database: this.configuracion.DB_NAME,
      ssl: this.configuracion.DB_SSL,
      url: this.configuracion.DATABASE_URL,

      // Configuraciones de conexión TypeORM
      autoLoadEntities: this.configuracion.DB_AUTO_LOAD_ENTITIES,
      retryDelay: this.configuracion.DB_RETRY_DELAY,
      retryAttempts: this.configuracion.DB_RETRY_ATTEMPTS,
      connectionTimeout: this.configuracion.DB_CONNECTION_TIMEOUT,
      idleTimeout: this.configuracion.DB_IDLE_TIMEOUT,
      maxConnections: this.configuracion.DB_MAX_CONNECTIONS,
      minConnections: this.configuracion.DB_MIN_CONNECTIONS,
    };
  }

  get redis(): ConfiguracionRedis {
    return {
      host: this.configuracion.REDIS_HOST,
      port: this.configuracion.REDIS_PORT,
      password: this.configuracion.REDIS_PASSWORD,
      url: this.configuracion.REDIS_URL,
    };
  }

  get aplicacion(): ConfiguracionAplicacion {
    return {
      nombre: this.configuracion.APP_NAME,
      version: this.configuracion.APP_VERSION,
      ambiente: this.configuracion.NODE_ENV,
      puerto: this.configuracion.PORT,
      frontendUrl: this.configuracion.FRONTEND_URL,
      apiUrl: this.configuracion.API_URL,
      logLevel: this.configuracion.LOG_LEVEL,
      timeZone: this.configuracion.TZ,
    };
  }

  get seguridad(): ConfiguracionSeguridad {
    return {
      jwtSecret: this.configuracion.JWT_SECRET,
      jwtExpiresIn: this.configuracion.JWT_EXPIRES_IN,
      jwtRefreshSecret: this.configuracion.JWT_REFRESH_SECRET,
      jwtRefreshExpiresIn: this.configuracion.JWT_REFRESH_EXPIRES_IN,
      encryptionKey: this.configuracion.ENCRYPTION_KEY,
      corsOrigin: this.configuracion.CORS_ORIGIN,
      rateLimitMax: this.configuracion.RATE_LIMIT_MAX,
      rateLimitWindow: this.configuracion.RATE_LIMIT_WINDOW_MS,
    };
  }

  get email(): ConfiguracionEmail {
    return {
      provider: this.configuracion.EMAIL_PROVIDER,
      resendApiKey: this.configuracion.RESEND_API_KEY,
      emailFrom: this.configuracion.EMAIL_FROM,
      smtpHost: this.configuracion.SMTP_HOST,
      smtpPort: this.configuracion.SMTP_PORT,
      smtpUser: this.configuracion.SMTP_USER,
      smtpPassword: this.configuracion.SMTP_PASSWORD,
    };
  }

  get storage(): ConfiguracionStorage {
    return {
      provider: this.configuracion.STORAGE_PROVIDER,
      storagePath: this.configuracion.STORAGE_PATH,
      awsAccessKeyId: this.configuracion.AWS_ACCESS_KEY_ID,
      awsSecretAccessKey: this.configuracion.AWS_SECRET_ACCESS_KEY,
      awsRegion: this.configuracion.AWS_REGION,
      awsS3Bucket: this.configuracion.AWS_S3_BUCKET,
    };
  }

  get logging(): ConfiguracionLogging {
    return {
      level: this.configuracion.LOG_LEVEL,
      maxFiles: this.configuracion.WINSTON_MAX_FILES,
      maxSize: this.configuracion.WINSTON_MAX_SIZE,
      logDirectory: this.configuracion.WINSTON_LOG_DIR,
      enableConsoleLogging: this.configuracion.WINSTON_CONSOLE_ENABLED,
      enableFileLogging:
        this.configuracion.WINSTON_FILE_ENABLED ??
        this.configuracion.NODE_ENV !== 'development', // Lógica automática
      datePattern: this.configuracion.WINSTON_DATE_PATTERN,
      enableErrorFile: this.configuracion.WINSTON_ERROR_FILE_ENABLED,
      format: this.configuracion.NODE_ENV === 'production' ? 'json' : 'simple',
    };
  }

  get oauth(): ConfiguracionOAuth {
    return {
      googleClientId: this.configuracion.GOOGLE_CLIENT_ID,
      googleClientSecret: this.configuracion.GOOGLE_CLIENT_SECRET,
    };
  }

  // Método para verificar si una característica está habilitada
  caracteristicaHabilitada(caracteristica: string): boolean {
    switch (caracteristica) {
      case 'email':
        return (
          !!this.configuracion.RESEND_API_KEY ||
          (!!this.configuracion.SMTP_HOST && !!this.configuracion.SMTP_USER)
        );
      case 'redis':
        return (
          !!this.configuracion.REDIS_URL || !!this.configuracion.REDIS_HOST
        );
      case 's3':
        return (
          !!this.configuracion.AWS_ACCESS_KEY_ID &&
          !!this.configuracion.AWS_SECRET_ACCESS_KEY
        );
      case 'oauth_google':
        return (
          !!this.configuracion.GOOGLE_CLIENT_ID &&
          !!this.configuracion.GOOGLE_CLIENT_SECRET
        );
      default:
        return false;
    }
  }

  // Obtener configuración completa (sin datos sensibles) - retorna datos directos
  obtenerConfiguracionPublica(): ConfiguracionPublica {
    return {
      aplicacion: {
        nombre: this.aplicacion.nombre,
        version: this.aplicacion.version,
        ambiente: this.aplicacion.ambiente,
      },
      caracteristicas: {
        email: this.caracteristicaHabilitada('email'),
        storage: this.storage.provider,
        redis: this.caracteristicaHabilitada('redis'),
      },
      limites: {
        rateLimitMax: this.seguridad.rateLimitMax,
        rateLimitWindow: this.seguridad.rateLimitWindow,
      },
      baseDatos: {
        host: this.baseDatos.host,
        port: this.baseDatos.port,
        database: this.baseDatos.database,
        ssl: this.baseDatos.ssl,
      },
      redis: {
        host: this.redis.host,
        port: this.redis.port,
      },
    };
  }
}
