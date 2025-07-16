import { Module } from '@nestjs/common';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { ResponseModule } from './modules/respuestas/response.module';

@Module({
  imports: [
    ConfiguracionModule,
    DatabaseModule,
    RedisModule,
    ResponseModule, // Módulo de respuestas estandarizadas
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
