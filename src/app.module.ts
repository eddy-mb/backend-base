import { Module } from '@nestjs/common';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfiguracionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
