import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { newEnforcer, Enforcer } from 'casbin';
import { RedisService } from '../../redis/services/redis.service';
import { CasbinRuleRepository } from '../repositories/casbin-rule.repository';

@Injectable()
export class CasbinService implements OnModuleInit {
  private readonly logger = new Logger(CasbinService.name);
  private enforcer: Enforcer;

  constructor(
    private readonly redisService: RedisService,
    private readonly casbinRuleRepository: CasbinRuleRepository,
  ) {}

  async onModuleInit() {
    await this.initializeCasbin();
  }

  private async initializeCasbin(): Promise<void> {
    try {
      const modelPath = `${process.cwd()}/src/modules/autorizacion/config/rbac_model.conf`;
      this.enforcer = await newEnforcer(modelPath);
      await this.loadPoliciesFromDatabase();
      this.logger.log('Casbin enforcer inicializado exitosamente');
    } catch (error) {
      this.logger.error('Error inicializando Casbin:', error);
      throw error;
    }
  }

  private async loadPoliciesFromDatabase(): Promise<void> {
    const policies = await this.casbinRuleRepository.findAllPolicies();
    const groupings = await this.casbinRuleRepository.findAllGroupings();

    for (const policy of policies) {
      await this.enforcer.addPolicy(policy.v0, policy.v1, policy.v2);
    }

    for (const group of groupings) {
      await this.enforcer.addGroupingPolicy(group.v0, group.v1);
    }
  }

  async enforce(
    subject: string,
    object: string,
    action: string,
  ): Promise<boolean> {
    const cacheKey = `casbin:${subject}:${object}:${action}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached !== null) {
        return cached === 'true';
      }

      const result = await this.enforcer.enforce(subject, object, action);

      // Cache con TTL usando el método set con ttl
      await this.redisService.set(cacheKey, result.toString(), 300);

      return result;
    } catch (error) {
      this.logger.error('Error en enforce:', error);
      return false;
    }
  }

  async recargarPoliticas(): Promise<void> {
    try {
      this.enforcer.clearPolicy();
      await this.loadPoliciesFromDatabase();
      await this.invalidarCache();
      this.logger.log('Políticas recargadas exitosamente');
    } catch (error) {
      this.logger.error('Error recargando políticas:', error);
    }
  }

  private async invalidarCache(): Promise<void> {
    try {
      const keys = await this.redisService.keys('casbin:*');
      if (keys.length > 0) {
        // Eliminar claves una por una ya que del() solo acepta una key
        for (const key of keys) {
          await this.redisService.del(key);
        }
      }
    } catch (error) {
      this.logger.error('Error invalidando cache:', error);
    }
  }
}
