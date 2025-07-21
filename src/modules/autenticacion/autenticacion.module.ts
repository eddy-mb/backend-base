import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfiguracionService } from '../configuracion/services/configuracion.service';
import { RedisModule } from '../redis/redis.module';
import { LoggingModule } from '../logging/logging.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { Usuario } from './entities/usuario.entity';
import { TokenVerificacion } from './entities/token-verificacion.entity';
import { AuthController } from './controllers/auth.controller';
import { OAuthController } from './controllers/oauth.controller';
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt.service';
import { TokenService } from './services/token.service';
import { OAuthService } from './services/oauth.service';
import { UsuarioRepository } from './repositories/usuario.repository';
import { TokenVerificacionRepository } from './repositories/token-verificacion.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

// Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    // TypeORM entities
    TypeOrmModule.forFeature([Usuario, TokenVerificacion]),

    // Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT Module
    JwtModule.registerAsync({
      useFactory: (configuracionService: ConfiguracionService) => ({
        secret: configuracionService.seguridad.jwtSecret,
        signOptions: {
          expiresIn: configuracionService.seguridad.jwtExpiresIn,
        },
      }),
      inject: [ConfiguracionService],
    }),

    // Throttler for rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configuracionService: ConfiguracionService) => ({
        throttlers: [
          {
            ttl: configuracionService.seguridad.rateLimitWindow,
            limit: configuracionService.seguridad.rateLimitMax,
          },
        ],
      }),
      inject: [ConfiguracionService],
    }),

    // Módulos dependientes
    RedisModule,
    LoggingModule,
    AuditoriaModule,
  ],

  controllers: [AuthController, OAuthController],

  providers: [
    AuthService,
    JwtTokenService,
    TokenService,
    OAuthService,
    UsuarioRepository,
    TokenVerificacionRepository,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
  ],

  exports: [
    AuthService,
    JwtTokenService,
    TokenService,
    AuthService,
    JwtTokenService,
    TokenService,
    JwtAuthGuard,
    UsuarioRepository,
    JwtStrategy,
    PassportModule,
  ],
})
export class AutenticacionModule {}
