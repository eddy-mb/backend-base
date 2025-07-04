import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
} from '../interfaces/configuracion.interface';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  private readonly logger = new Logger(ConfiguracionService.name);
  private configuracion!: ConfiguracionSistema;

  constructor(private configService: ConfigService) {}

  onModuleInit(): void {
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
      default:
        return false;
    }
  }

  // Obtener configuración completa (sin datos sensibles)
  obtenerConfiguracionPublica() {
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
