import { Module } from '@nestjs/common';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';

@Module({
  imports: [ConfiguracionModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
