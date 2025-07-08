import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Servicio de health check específico para Redis
 * Se integra con el ValidacionService del Módulo 1
 */
@Injectable()
export class RedisHealthService {
  private readonly logger = new Logger(RedisHealthService.name);

  constructor(private redisService: RedisService) {}

  /**
   * Verificar estado de Redis con métricas detalladas
   */
  async verificarEstado(): Promise<{
    conectado: boolean;
    latencia?: number;
    memoria?: string;
    version?: string;
    error?: string;
  }> {
    try {
      const inicio = Date.now();

      // Verificar conectividad básica
      const ping = await this.redisService.ping();

      if (!ping) {
        return {
          conectado: false,
          error: 'Redis no responde al ping',
        };
      }

      const latencia = Date.now() - inicio;

      // Obtener información del servidor
      const info = await this.redisService.info();
      const estadisticas = this.parseInfo(info);

      // Log de latencia alta
      if (latencia > 100) {
        this.logger.warn(`Redis latencia alta: ${latencia}ms`);
      }

      return {
        conectado: true,
        latencia,
        memoria: estadisticas.memoria,
        version: estadisticas.version,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error verificando Redis:', errorMessage);

      return {
        conectado: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verificación simple para health checks
   */
  async ping(): Promise<boolean> {
    try {
      return await this.redisService.ping();
    } catch (error) {
      this.logger.error('Error en ping de Redis:', error);
      return false;
    }
  }

  /**
   * Parsear información del servidor Redis
   */
  private parseInfo(info: string): { version?: string; memoria?: string } {
    const resultado: { version?: string; memoria?: string } = {};

    const lineas = info.split('\r\n');

    for (const linea of lineas) {
      if (linea.startsWith('redis_version:')) {
        resultado.version = linea.split(':')[1];
      }
      if (linea.startsWith('used_memory_human:')) {
        resultado.memoria = linea.split(':')[1];
      }
    }

    return resultado;
  }

  /**
   * Verificar rendimiento básico de Redis
   */
  async verificarRendimiento(): Promise<{
    pingLatencia: number;
    setLatencia: number;
    getLatencia: number;
  }> {
    const testKey = 'health:check:performance';
    const testValue = 'test-performance-value';

    try {
      // Test PING
      const pingInicio = Date.now();
      await this.redisService.ping();
      const pingLatencia = Date.now() - pingInicio;

      // Test SET
      const setInicio = Date.now();
      await this.redisService.set(testKey, testValue, 5); // TTL 5 segundos
      const setLatencia = Date.now() - setInicio;

      // Test GET
      const getInicio = Date.now();
      const valor = await this.redisService.get(testKey);
      const getLatencia = Date.now() - getInicio;

      // Limpiar clave de test
      await this.redisService.del(testKey);

      if (valor !== testValue) {
        this.logger.warn(
          'Test de rendimiento Redis: valor recuperado no coincide',
        );
      }

      return {
        pingLatencia,
        setLatencia,
        getLatencia,
      };
    } catch (error) {
      this.logger.error('Error en test de rendimiento Redis:', error);
      throw error;
    }
  }
}
