import { Module } from '@nestjs/common';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { ResponseModule } from './modules/respuestas/response.module';
import { LoggingModule } from './modules/logging/logging.module';

@Module({
  imports: [
    ConfiguracionModule,
    DatabaseModule,
    RedisModule,
    ResponseModule, // Módulo de respuestas estandarizadas
    LoggingModule, // Módulo de logging estructurado
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
