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

/**
 * Módulo de Autenticación
 *
 * Proporciona:
 * - Sistema completo de autenticación JWT
 * - Login/logout con blacklist en Redis
 * - Recuperación de contraseña
 * - OAuth Google
 * - Rate limiting
 * - Guards reutilizables
 * - Auditoría automática de eventos de seguridad
 */
@Module({
  imports: [
    // Módulos base requeridos
    UsuariosModule,
    RedisModule,
    ConfiguracionModule,
    AuditoriaModule,
    LoggingModule,

    // Registro de entidades
    TypeOrmModule.forFeature([TokenUsuario]),

    // Passport para estrategias de autenticación
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),

    // JWT Module con configuración dinámica
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

    // Throttler para rate limiting
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
    // Servicios principales
    AuthService,
    JwtTokenService,
    TokenService,
    OAuthService,

    // Repositorios
    TokenUsuarioRepository,

    // Estrategias de Passport
    JwtStrategy,
    GoogleStrategy,

    // Guards
    JwtAuthGuard,
  ],

  exports: [
    // Exportar para uso en otros módulos
    AuthService,
    JwtTokenService,
    TokenService,
    OAuthService,
    JwtAuthGuard,

    // Exportar JwtModule para que otros módulos puedan usar JwtService
    JwtModule,
  ],
})
export class AutenticacionModule {}
