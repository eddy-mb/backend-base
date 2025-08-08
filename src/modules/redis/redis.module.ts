import { Global, Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { ConfiguracionService } from '../configuracion/services/configuracion.service';
import { ValidacionService } from '../configuracion/services/validacion.service';
import { RedisService } from './services/redis.service';
import { QueueService } from './services/queue.service';
import { RedisHealthService } from './services/redis-health.service';
import { forwardRef } from '@nestjs/common';

@Global()
@Module({
  imports: [
    forwardRef(() => ConfiguracionModule),
    BullModule.forRootAsync({
      useFactory: (configuracionService: ConfiguracionService) => {
        const redisConfig = configuracionService.redis;

        // Configuración Bull usando la misma conexión Redis
        const bullConfig = {
          redis: redisConfig.url
            ? { url: redisConfig.url }
            : {
                host: redisConfig.host,
                port: redisConfig.port,
                password: redisConfig.password,
              },
          defaultJobOptions: {
            removeOnComplete: 10,
            removeOnFail: 5,
            attempts: 3,
            backoff: {
              type: 'exponential' as const,
              delay: 2000,
            },
          },
          settings: {
            stalledInterval: 30 * 1000, // 30 segundos
            retryProcessDelay: 5 * 1000, // 5 segundos
          },
        };

        return bullConfig;
      },
      inject: [ConfiguracionService],
    }),
  ],
  providers: [RedisService, QueueService, RedisHealthService],
  exports: [RedisService, QueueService, RedisHealthService, BullModule],
})
export class RedisModule implements OnModuleInit {
  constructor(
    private redisHealthService: RedisHealthService,
    private validacionService: ValidacionService,
  ) {}

  onModuleInit() {
    // Inyectar RedisHealthService al ValidacionService
    this.validacionService.setRedisHealthService(this.redisHealthService);
  }
}
