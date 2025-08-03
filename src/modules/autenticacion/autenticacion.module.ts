import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';

// Módulos dependientes
import { UsuariosModule } from '../usuarios/usuarios.module';
import { RedisModule } from '../redis/redis.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { LoggingModule } from '../logging/logging.module';

// Servicios
import { AuthService } from './services/auth.service';
import { JwtTokenService } from './services/jwt-token.service';
import { OAuthService } from './services/oauth.service';

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

    // Throttler para rate limiting con Redis storage
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
          // TODO: Configurar Redis storage cuando esté disponible
          // storage: new ThrottlerStorageRedisService(redisService),
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
    OAuthService,

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
    OAuthService,
    JwtAuthGuard,

    // Exportar JwtModule para que otros módulos puedan usar JwtService
    JwtModule,
  ],
})
export class AutenticacionModule {}
