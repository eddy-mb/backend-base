import { Module } from '@nestjs/common';

import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { ResponseModule } from './modules/respuestas/response.module';
import { LoggingModule } from './modules/logging/logging.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { AutenticacionModule } from './modules/autenticacion/autenticacion.module';
import { AutorizacionModule } from './modules/autorizacion/autorizacion.module';

@Module({
  imports: [
    ConfiguracionModule,
    DatabaseModule,
    RedisModule,
    ResponseModule, // Módulo de respuestas estandarizadas
    LoggingModule, // Módulo de logging estructurado
    AuditoriaModule, // Módulo de auditoría
    UsuariosModule, // Módulo de gestión de usuarios
    AutenticacionModule, // Módulo de autenticación JWT
    AutorizacionModule, // Módulo de autorización RBAC con Casbin
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
