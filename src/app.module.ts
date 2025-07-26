import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { ResponseModule } from './modules/respuestas/response.module';
import { LoggingModule } from './modules/logging/logging.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AutenticacionModule } from './modules/autenticacion/autenticacion.module';
import { AutorizacionModule } from './modules/autorizacion/autorizacion.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';

@Module({
  imports: [
    ConfiguracionModule,
    DatabaseModule,
    RedisModule,
    ResponseModule, // Módulo de respuestas estandarizadas
    LoggingModule, // Módulo de logging estructurado
    AuditoriaModule, // Módulo de auditoría
    AutenticacionModule, // Módulo de autenticación JWT
    AutorizacionModule, // Módulo de autorización RBAC
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
