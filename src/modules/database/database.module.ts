import { Global, Module } from '@nestjs/common';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  imports: [ConfiguracionModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
