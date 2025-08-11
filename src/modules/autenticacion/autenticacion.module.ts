import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

// Módulos dependientes
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RedisModule } from '../redis/redis.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { LoggingModule } from '../logging/logging.module';
import { AutorizacionModule } from '../autorizacion/autorizacion.module';

// Entidades
import { TokenUsuario } from './entities/token-usuario.entity';

// Servicios
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt-token.service';
import { TokenService } from './services/token.service';
import { OAuthService } from './services/oauth.service';

// Repositorios
import { TokenUsuarioRepository } from './repositories/token-usuario.repository';

// Controladores
import { AuthController } from './controllers/auth.controller';
import { OAuthController } from './controllers/oauth.controller';

// Guards y Strategies
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Configuración
import { ConfiguracionService } from '../configuracion/services/configuracion.service';

@Module({
  imports: [
    UsuariosModule,
    RedisModule,
    ConfiguracionModule,
    AuditoriaModule,
    LoggingModule,
    AutorizacionModule,

    TypeOrmModule.forFeature([TokenUsuario]),

    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    JwtModule.registerAsync({
      useFactory: (configuracionService: ConfiguracionService) => {
        const config = configuracionService.seguridad;
        return {
          secret: config.jwtSecret,
          signOptions: {
            expiresIn: config.jwtExpiresIn,
          },
        };
      },
      inject: [ConfiguracionService],
    }),

    ThrottlerModule.forRootAsync({
      useFactory: (configuracionService: ConfiguracionService) => {
        const config = configuracionService.seguridad;
        return {
          throttlers: [
            {
              name: 'default',
              ttl: config.rateLimitWindow,
              limit: config.rateLimitMax,
            },
          ],
        };
      },
      inject: [ConfiguracionService],
    }),
  ],

  controllers: [AuthController, OAuthController],

  providers: [
    AuthService,
    JwtTokenService,
    TokenService,
    OAuthService,
    TokenUsuarioRepository,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
  ],

  exports: [
    AuthService,
    JwtTokenService,
    TokenService,
    OAuthService,
    JwtAuthGuard,
    JwtModule,
  ],
})
export class AutenticacionModule {}
