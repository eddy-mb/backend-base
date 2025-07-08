/**
 * Interfaces para operaciones de Redis
 */

export interface OperacionesCache {
  /**
   * Obtener valor por clave
   */
  get(key: string): Promise<string | null>;

  /**
   * Establecer valor con TTL opcional
   */
  set(key: string, value: string, ttl?: number): Promise<void>;

  /**
   * Eliminar clave
   */
  del(key: string): Promise<boolean>;

  /**
   * Verificar si existe una clave
   */
  exists(key: string): Promise<boolean>;

  /**
   * Obtener múltiples valores
   */
  mget(keys: string[]): Promise<(string | null)[]>;

  /**
   * Incrementar valor numérico
   */
  increment(key: string, value?: number): Promise<number>;

  /**
   * Establecer TTL para una clave existente
   */
  expire(key: string, ttl: number): Promise<boolean>;

  /**
   * Obtener claves que coincidan con un patrón
   */
  keys(pattern: string): Promise<string[]>;

  /**
   * Verificar conectividad (health check)
   */
  ping(): Promise<boolean>;

  /**
   * Obtener información del servidor Redis
   */
  info(): Promise<string>;
}

export interface EstadisticasRedis {
  conectado: boolean;
  tiempoRespuesta?: number;
  memoria?: string;
  version?: string;
  ultimoError?: string;
}
