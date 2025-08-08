import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

// Entidades
import { Usuario } from './entities/usuario.entity';
import { PerfilUsuario } from './entities/perfil-usuario.entity';

// Servicios
import { UsuariosService } from './services/usuarios.service';
import { AvatarService } from './services/avatar.service';

// Repositories
import { UsuarioRepository } from './repositories/usuario.repository';
import { PerfilUsuarioRepository } from './repositories/perfil-usuario.repository';

// Controladores
import { UsuariosController } from './controllers/usuarios.controller';

// Módulos de dependencias
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { LoggingModule } from '../logging/logging.module';
import { createMulterOptions } from '../../config/upload.config';
import { AVATAR_CONFIG } from './constants/usuarios.constants';
import { AutorizacionModule } from '../autorizacion';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario, PerfilUsuario]),

    // Multer con configuración unificada
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createMulterOptions(configService, {
          subfolder: AVATAR_CONFIG.DIRECTORIO,
          mimeTypes: AVATAR_CONFIG.TIPOS_PERMITIDOS,
          maxSizeMB: AVATAR_CONFIG.TAMANO_MAXIMO,
          prefix: AVATAR_CONFIG.PREFIX,
        }),
    }),
    forwardRef(() => AutorizacionModule),
    forwardRef(() => ConfiguracionModule),
    LoggingModule,
  ],

  controllers: [UsuariosController],

  providers: [
    UsuariosService,
    AvatarService,
    UsuarioRepository,
    PerfilUsuarioRepository,
  ],

  exports: [UsuariosService, TypeOrmModule],
})
export class UsuariosModule {}
