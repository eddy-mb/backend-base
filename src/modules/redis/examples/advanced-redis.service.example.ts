import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service';

/**
 * Ejemplo de extensión del RedisService para casos específicos
 * Este archivo es solo un ejemplo y no se debe incluir en la infraestructura base
 */
@Injectable()
export class AdvancedRedisService extends RedisService {
  /**
   * Operaciones de Hash
   */
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.getClient().hget(key, field);
    } catch {
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      const result = await this.getClient().hset(key, field, value);
      return result === 1;
    } catch {
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.getClient().hgetall(key);
    } catch {
      return {};
    }
  }

  /**
   * Lock distribuido simple
   */
  async acquireLock(lockKey: string, timeout: number = 10): Promise<boolean> {
    try {
      const result = await this.getClient().set(
        lockKey,
        'locked',
        'EX',
        timeout,
        'NX',
      );
      return result === 'OK';
    } catch {
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<boolean> {
    try {
      const result = await this.getClient().del(lockKey);
      return result === 1;
    } catch {
      return false;
    }
  }
}
