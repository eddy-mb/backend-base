import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

// Entities
import { Rol } from './entities/rol.entity';
import { UsuarioRol } from './entities/usuario-rol.entity';
import { CasbinRule } from './entities/casbin-rule.entity';

// Repositories
import { RolRepository } from './repositories/rol.repository';
import { UsuarioRolRepository } from './repositories/usuario-rol.repository';
import { CasbinRuleRepository } from './repositories/casbin-rule.repository';

// Services
import { CasbinService } from './services/casbin.service';
import { RolesService } from './services/roles.service';
import { PoliticasService } from './services/politicas.service';

// Guards
import { CasbinGuard } from './guards/casbin.guard';

// Controllers
import { RolesController } from './controllers/roles.controller';
import { PoliticasController } from './controllers/politicas.controller';

// Modules
import { RedisModule } from '../redis/redis.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, UsuarioRol, CasbinRule]),
    RedisModule,
    UsuariosModule,
  ],
  providers: [
    // Repositories
    RolRepository,
    UsuarioRolRepository,
    CasbinRuleRepository,

    // Services
    CasbinService,
    RolesService,
    PoliticasService,

    // Global Guard
    {
      provide: APP_GUARD,
      useClass: CasbinGuard,
    },
  ],
  controllers: [RolesController, PoliticasController],
  exports: [CasbinService, RolesService, PoliticasService],
})
export class AutorizacionModule {}
