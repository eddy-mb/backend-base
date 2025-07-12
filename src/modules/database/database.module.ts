import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import { ConfiguracionService } from '../configuracion/services/configuracion.service';

@Global()
@Module({
  imports: [
    ConfiguracionModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfiguracionModule],
      useFactory: (configService: ConfiguracionService) => {
        // Usar la configuración de base de datos del módulo de configuración
        const dbConfig = configService.baseDatos;
        const appConfig = configService.aplicacion;

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.user,
          password: dbConfig.password,
          database: dbConfig.database,
          ssl: dbConfig.ssl,

          // Entities - auto-detección en toda la aplicación
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],

          // Migrations
          migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],

          // Configuraciones por ambiente
          // SIEMPRE false - usar migraciones para todos los ambientes
          synchronize: false,
          logging:
            appConfig.ambiente === 'development'
              ? ['query', 'error', 'warn']
              : ['error'],

          // Auto-load entities registradas en módulos
          autoLoadEntities: dbConfig.autoLoadEntities,

          // Configuraciones de conexión desde ConfiguraciónService
          retryDelay: dbConfig.retryDelay,
          retryAttempts: dbConfig.retryAttempts,

          // Pool de conexiones desde configuración validada
          extra: {
            max: dbConfig.maxConnections,
            min: dbConfig.minConnections,
            acquireTimeoutMillis: dbConfig.connectionTimeout,
            idleTimeoutMillis: dbConfig.idleTimeout,
          },
        };
      },
      inject: [ConfiguracionService],
    }),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
