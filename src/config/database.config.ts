import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import dotenv from 'dotenv';

dotenv.config();
// Función para crear configuración de TypeORM
export const createTypeOrmConfig = (
  configService: ConfigService,
): DataSourceOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: parseInt(configService.get<string>('DB_PORT', '5432')),
    username: configService.get<string>('DB_USER') || 'postgres',
    password: configService.get<string>('DB_PASSWORD') || 'password',
    database: configService.get<string>('DB_NAME') || 'database',
    ssl: configService.get<string>('DB_SSL', 'false') === 'true',

    // Entities
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],

    // Migrations
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

    // Configuraciones por ambiente
    // SIEMPRE false - usar migraciones para todos los ambientes
    synchronize: false,
    logging: !isProduction ? ['query', 'error', 'warn'] : ['error'],

    // Pool de conexiones desde variables de entorno
    extra: {
      max: parseInt(configService.get('DB_MAX_CONNECTIONS', '20')),
      min: parseInt(configService.get('DB_MIN_CONNECTIONS', '5')),
      acquireTimeoutMillis: parseInt(
        configService.get('DB_CONNECTION_TIMEOUT', '60000'),
      ),
      idleTimeoutMillis: parseInt(
        configService.get('DB_IDLE_TIMEOUT', '600000'),
      ),
    },
  };
};

// DataSource para CLI de TypeORM (necesario para migraciones)
const configService = new ConfigService();

// Crear configuración base
const baseConfig = createTypeOrmConfig(configService);

// Para CLI, sobrescribir rutas con paths absolutos
export default new DataSource({
  ...baseConfig,
  // Para migraciones, usar rutas absolutas específicas
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
