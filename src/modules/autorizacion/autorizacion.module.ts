import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

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

@Module({
  imports: [
    TypeOrmModule.forFeature([Rol, UsuarioRol, CasbinRule]),
    RedisModule,
    UsuariosModule,
  ],
  providers: [
    RolRepository,
    UsuarioRolRepository,
    CasbinRuleRepository,
    CasbinService,
    RolesService,
    PoliticasService,
    CasbinGuard, // Sin APP_GUARD
  ],
  controllers: [RolesController, PoliticasController],
  exports: [CasbinService, RolesService, PoliticasService, CasbinGuard],
})
export class AutorizacionModule {}
