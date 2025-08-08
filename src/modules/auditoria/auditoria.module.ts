import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditoriaLog } from './entities/auditoria-log.entity';
import { AuditoriaRepository } from './repositories/auditoria.repository';
import { AuditoriaService } from './services/auditoria.service';
import { AuditoriaController } from './controllers/auditoria.controller';
import { AuditoriaInterceptor } from './interceptors/auditoria.interceptor';
import { LoggingModule } from '../logging/logging.module';
import { AutorizacionModule } from '../autorizacion/autorizacion.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditoriaLog]),
    LoggingModule,
    AutorizacionModule,
  ],

  providers: [
    AuditoriaRepository,
    AuditoriaService,
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
  ],

  controllers: [AuditoriaController],

  exports: [AuditoriaService, AuditoriaRepository],
})
export class AuditoriaModule {}
