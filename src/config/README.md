# Config Directory

Esta carpeta contiene **configuraciones técnicas específicas** que requieren lógica adicional o configuración compleja de librerías.

## 🎯 Propósito:

Separar configuraciones complejas del módulo principal de configuración para mantener responsabilidades claras.

## 📁 Estructura típica:

```
config/
├── database.config.ts      # Configuración específica de TypeORM
├── redis.config.ts         # Configuración de Redis/Bull
├── jwt.config.ts           # Configuración de JWT/Passport
├── swagger.config.ts       # Configuración de Swagger/OpenAPI
├── winston.config.ts       # Configuración de logging
├── multer.config.ts        # Configuración de upload de archivos
└── throttler.config.ts     # Configuración de rate limiting
```

## 🔍 Diferencia con /modules/configuracion:

| Aspecto       | /modules/configuracion            | /config                                        |
| ------------- | --------------------------------- | ---------------------------------------------- |
| **Propósito** | Validar y centralizar variables   | Configurar librerías específicas               |
| **Contenido** | Variables de entorno + validación | Factory functions + configuración compleja     |
| **Ejemplo**   | `JWT_SECRET="abc123"`             | `JwtModule.registerAsync({ useFactory: ... })` |

## 📝 Ejemplos de archivos:

### database.config.ts (TypeORM)

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

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

    // Entities y migraciones
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],

    // SIEMPRE false - usar migraciones para todos los ambientes
    synchronize: false,
    logging: !isProduction ? ['query', 'error', 'warn'] : ['error'],

    // Pool de conexiones
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

// DataSource para CLI de TypeORM (migraciones)
export default new DataSource(createTypeOrmConfig(new ConfigService()));
```

### jwt.config.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = async (
  configService: ConfigService,
): Promise<JwtModuleOptions> => ({
  secret: configService.get('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get('JWT_EXPIRES_IN'),
  },
});
```

### redis.config.ts

```typescript
import { ConfigService } from '@nestjs/config';
import { BullModuleOptions } from '@nestjs/bull';

export const redisConfig = async (
  configService: ConfigService,
): Promise<BullModuleOptions> => ({
  redis: {
    host: configService.get('REDIS_HOST'),
    port: parseInt(configService.get('REDIS_PORT')),
    password: configService.get('REDIS_PASSWORD'),
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

### winston.config.ts

```typescript
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const createWinstonConfig = (
  configService: ConfigService,
): winston.LoggerOptions => {
  const logLevel = configService.get('LOG_LEVEL', 'info');
  const logDir = configService.get('WINSTON_LOG_DIR', './logs');
  const isProduction = configService.get('NODE_ENV') === 'production';

  const transports: winston.transport[] = [];

  // Console transport para desarrollo
  if (!isProduction) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
    );
  }

  // File transports para producción
  if (isProduction) {
    transports.push(
      new winston.transports.DailyRotateFile({
        filename: `${logDir}/application-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  return {
    level: logLevel,
    transports,
  };
};
```

## 🚀 Cuándo usar cada uno:

### Usa `/modules/configuracion` para:

- ✅ Validar variables de entorno con Zod
- ✅ Centralizar configuraciones del sistema
- ✅ Exponer APIs de configuración
- ✅ Health checks de infraestructura

### Usa `/config` para:

- ✅ Configuraciones de módulos específicos de NestJS
- ✅ Factory functions que requieren ConfigService
- ✅ Configuraciones complejas con lógica condicional
- ✅ Setup específico de librerías (TypeORM, Bull, Winston, etc.)

## 📋 Scripts TypeORM disponibles:

```bash
# Generar migración
npm run migration:generate -- NombreDeLaMigracion

# Ejecutar migraciones
npm run migration:run

# Revertir migración
npm run migration:revert

# Sincronizar schema (solo desarrollo)
npm run schema:sync

# Ejecutar seeds
npm run seed
```

## 🔧 Configuración TypeORM:

El proyecto utiliza **TypeORM** como ORM principal con las siguientes características:

- ✅ Configuración con pool de conexiones optimizado
- ✅ Sistema de migraciones robusto y versionado
- ✅ Entities con decoradores TypeScript nativos
- ✅ Repository pattern implementado
- ✅ CLI de TypeORM configurado y funcional
- ✅ Seeds implementados para datos iniciales

### Variables de entorno TypeORM:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sistema_base_db
DB_SSL=false

# Pool de conexiones
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
DB_CONNECTION_TIMEOUT=60000
DB_IDLE_TIMEOUT=600000

# URL compuesta (alternativa)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_base_db"
```

## 💡 Mejores prácticas implementadas:

1. **Synchronize**: Siempre `false` - usar migraciones en todos los ambientes
2. **Logging**: Habilitado en desarrollo, solo errores en producción
3. **SSL**: Configurado por variable de entorno para flexibilidad
4. **Pool**: Configuración optimizada para alta concurrencia
5. **CLI**: DataSource exportado para comandos TypeORM
6. **Entities**: Auto-descubrimiento con patrones configurables
7. **Migrations**: Versionado automático con timestamps