import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfiguracionService } from './services/configuracion.service';
import { ValidacionService } from './services/validacion.service';
import { SistemaController } from './controllers/sistema.controller';
import { AutorizacionModule } from '../autorizacion';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
      expandVariables: true,
    }),
    AutorizacionModule,
  ],
  providers: [ConfiguracionService, ValidacionService],
  controllers: [SistemaController],
  exports: [ConfiguracionService, ValidacionService],
})
export class ConfiguracionModule {}
