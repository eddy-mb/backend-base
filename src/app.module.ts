import { Module } from '@nestjs/common';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { ResponseModule } from './modules/respuestas/response.module';
import { ObservabilidadModule } from './modules/observabilidad/observabilidad.module';

@Module({
  imports: [
    ConfiguracionModule,
    DatabaseModule,
    RedisModule,
    ResponseModule, // Módulo de respuestas estandarizadas
    ObservabilidadModule, // Módulo 5: Observabilidad (Logging + Auditoría)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
