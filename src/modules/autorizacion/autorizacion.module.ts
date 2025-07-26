import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entidades
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { Politica } from './entities/politica.entity';

// Servicios
import { RolService } from './services/rol.service';
import { PoliticaService } from './services/politica.service';
import { UsuarioRolService } from './services/usuario-rol.service';
import { CacheService } from './services/cache.service';

// Repositories
import { RolRepository } from './repositories/rol.repository';
import { PoliticaRepository } from './repositories/politica.repository';
import { UsuarioRolRepository } from './repositories/usuario-rol.repository';

// Guards
import { AutorizacionGuard } from './guards/autorizacion.guard';

// Controladores
import { RolController } from './controllers/rol.controller';
import { PoliticaController } from './controllers/politica.controller';
import { UsuarioRolController } from './controllers/usuario-rol.controller';

// Utilidades
// UrlMatcherUtil se usa como clase estática, no se inyecta

// Módulos importados
import { RedisModule } from '../redis/redis.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, UsuarioRol, Politica]),
    RedisModule,
    AuditoriaModule,
  ],
  providers: [
    // Servicios
    RolService,
    PoliticaService,
    UsuarioRolService,
    CacheService,

    // Repositories
    RolRepository,
    PoliticaRepository,
    UsuarioRolRepository,

    // Guards
    AutorizacionGuard,
  ],
  controllers: [RolController, PoliticaController, UsuarioRolController],
  exports: [
    // Servicios principales para otros módulos
    RolService,
    PoliticaService,
    UsuarioRolService,
    CacheService,

    // Guard para uso en otros módulos
    AutorizacionGuard,

    // Repositories si otros módulos los necesitan
    RolRepository,
    PoliticaRepository,
    UsuarioRolRepository,
  ],
})
export class AutorizacionModule implements OnModuleInit {
  constructor(private cacheService: CacheService) {}

  async onModuleInit() {
    // Cargar políticas en cache al inicializar el módulo
    await this.cacheService.cargarPoliticasEnCache();
  }
}
