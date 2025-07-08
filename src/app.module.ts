import { Module } from '@nestjs/common';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [ConfiguracionModule, DatabaseModule, RedisModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
