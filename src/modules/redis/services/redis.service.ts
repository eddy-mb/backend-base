import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis, { RedisOptions } from 'ioredis';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import {
  OperacionesCache,
  EstadisticasRedis,
} from '../interfaces/redis.interface';

@Injectable()
export class RedisService
  implements OperacionesCache, OnModuleInit, OnModuleDestroy
{
  private client!: Redis;
  private readonly logger = new Logger(RedisService.name);
  private conectado = false;
  private ultimoError?: string;

  constructor(private configuracionService: ConfiguracionService) {}

  async onModuleInit(): Promise<void> {
    await this.inicializarConexion();
  }

  async onModuleDestroy(): Promise<void> {
    await this.cerrarConexion();
  }

  /**
   * Inicializar conexión con Redis
   */
  private async inicializarConexion(): Promise<void> {
    try {
      const configRedis = this.configuracionService.redis;

      // Configuración de conexión con valores por defecto seguros
      const opcionesConexionBase: RedisOptions = {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        retryStrategy: (times: number) => {
          return times >= 3 ? null : times * 500;
        },
      };
      const opcionesConexion: RedisOptions = {
        host: configRedis.host,
        port: configRedis.port,
        password: configRedis.password,
        ...opcionesConexionBase,
      };

      // Usar URL si está disponible, sino usar opciones individuales
      if (configRedis.url) {
        this.client = new Redis(configRedis.url, opcionesConexionBase);
      } else {
        this.client = new Redis(opcionesConexion);
      }

      // Configurar listeners de eventos
      this.configurarEventos();

      // Solo conectar si NO está conectado
      if (
        this.client.status !== 'ready' &&
        this.client.status !== 'connecting'
      ) {
        await this.client.connect();
      }

      this.conectado = true;
      this.ultimoError = undefined;
      this.logger.log(
        `✅ Redis conectado en ${configRedis.host}:${configRedis.port}`,
      );
    } catch (error) {
      this.conectado = false;
      this.ultimoError =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error al conectar con Redis:', this.ultimoError);
      throw error;
    }
  }

  /**
   * Configurar eventos de conexión
   */
  private configurarEventos(): void {
    this.client.on('connect', () => {
      this.conectado = true;
      this.ultimoError = undefined;
      // this.logger.log('Redis conectado exitosamente');
    });

    this.client.on('ready', () => {
      // this.logger.log('Redis listo para recibir comandos');
    });

    this.client.on('error', (error) => {
      this.conectado = false;
      this.ultimoError = error.message;
      this.logger.error('Error en conexión Redis:', error.message);
    });

    this.client.on('close', () => {
      this.conectado = false;
      this.logger.warn('Conexión Redis cerrada');
    });

    this.client.on('reconnecting', (time: number) => {
      this.logger.log(`Reintentando conexión Redis en ${time}ms`);
    });
  }

  /**
   * Cerrar conexión con Redis
   */
  private async cerrarConexion(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.conectado = false;
        this.logger.log('Conexión Redis cerrada correctamente');
      }
    } catch (error) {
      this.logger.error('Error al cerrar conexión Redis:', error);
    }
  }

  // Implementación de OperacionesCache

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.error(`Error en GET ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error en SET ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const resultado = await this.client.del(key);
      return resultado > 0;
    } catch (error) {
      this.logger.error(`Error en DEL ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const resultado = await this.client.exists(key);
      return resultado === 1;
    } catch (error) {
      this.logger.error(`Error en EXISTS ${key}:`, error);
      return false;
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    try {
      return await this.client.mget(...keys);
    } catch (error) {
      this.logger.error(`Error en MGET:`, error);
      return new Array<string | null>(keys.length).fill(null);
    }
  }

  async increment(key: string, value = 1): Promise<number> {
    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      this.logger.error(`Error en INCREMENT ${key}:`, error);
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const resultado = await this.client.expire(key, ttl);
      return resultado === 1;
    } catch (error) {
      this.logger.error(`Error en EXPIRE ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Error en KEYS ${pattern}:`, error);
      return [];
    }
  }

  async ping(): Promise<boolean> {
    try {
      const resultado = await this.client.ping();
      return resultado === 'PONG';
    } catch (error) {
      this.logger.error('Error en PING:', error);
      return false;
    }
  }

  async info(): Promise<string> {
    try {
      return await this.client.info();
    } catch (error) {
      this.logger.error('Error en INFO:', error);
      return '';
    }
  }

  // Métodos utilitarios

  /**
   * Obtener cliente Redis nativo para casos avanzados
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Obtener estadísticas de conexión
   */
  async obtenerEstadisticas(): Promise<EstadisticasRedis> {
    const estadisticas: EstadisticasRedis = {
      conectado: this.conectado,
      ultimoError: this.ultimoError,
    };

    if (this.conectado) {
      try {
        const inicio = Date.now();
        await this.ping();
        estadisticas.tiempoRespuesta = Date.now() - inicio;

        const info = await this.info();
        const lineas = info.split('\r\n');

        // Extraer información útil
        for (const linea of lineas) {
          if (linea.startsWith('redis_version:')) {
            estadisticas.version = linea.split(':')[1];
          }
          if (linea.startsWith('used_memory_human:')) {
            estadisticas.memoria = linea.split(':')[1];
          }
        }
      } catch (error) {
        this.logger.error('Error obteniendo estadísticas:', error);
      }
    }

    return estadisticas;
  }

  /**
   * Obtener opciones de conexión para Bull
   */
  getConnectionOptions() {
    const configRedis = this.configuracionService.redis;

    if (configRedis.url) {
      return { url: configRedis.url };
    }

    return {
      host: configRedis.host,
      port: configRedis.port,
      password: configRedis.password,
    };
  }

  /**
   * Verificar si Redis está habilitado
   */
  isEnabled(): boolean {
    return this.configuracionService.caracteristicaHabilitada('redis');
  }
}
