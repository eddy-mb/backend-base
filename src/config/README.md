# Config Directory

Esta carpeta contiene **configuraciones técnicas específicas** que requieren lógica adicional o configuración compleja de librerías.

## 🎯 Propósito:

Separar configuraciones complejas del módulo principal de configuración para mantener responsabilidades claras.

## 📁 Estructura típica:

```
config/
├── database.config.ts      # Configuración específica de Prisma
├── redis.config.ts         # Configuración de Redis/Bull
├── jwt.config.ts           # Configuración de JWT/Passport
├── swagger.config.ts       # Configuración de Swagger/OpenAPI
├── winston.config.ts       # Configuración de logging
├── multer.config.ts        # Configuración de upload de archivos
└── throttler.config.ts     # Configuración de rate limiting
```

## 🔍 Diferencia con /modules/configuracion:

| Aspecto | /modules/configuracion | /config |
|---------|----------------------|---------|
| **Propósito** | Validar y centralizar variables | Configurar librerías específicas |
| **Contenido** | Variables de entorno + validación | Factory functions + configuración compleja |
| **Ejemplo** | `JWT_SECRET="abc123"` | `JwtModule.registerAsync({ useFactory: ... })` |

## 📝 Ejemplos de archivos:

### database.config.ts
```typescript
import { ConfigService } from '@nestjs/config';
import { PrismaModuleOptions } from 'nestjs-prisma';

export const databaseConfig = async (configService: ConfigService): Promise<PrismaModuleOptions> => ({
  prismaOptions: {
    datasources: {
      db: {
        url: configService.get('DATABASE_URL'),
      },
    },
    log: configService.get('NODE_ENV') === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  },
});
```

### jwt.config.ts
```typescript
import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = async (configService: ConfigService): Promise<JwtModuleOptions> => ({
  secret: configService.get('JWT_SECRET'),
  signOptions: {
    expiresIn: configService.get('JWT_EXPIRES_IN'),
  },
});
```

## 🚀 Cuándo usar cada uno:

### Usa `/modules/configuracion` para:
- ✅ Validar variables de entorno
- ✅ Centralizar configuraciones
- ✅ Exponer APIs de configuración
- ✅ Health checks

### Usa `/config` para:
- ✅ Configuraciones de módulos de NestJS
- ✅ Factory functions complejas
- ✅ Configuraciones que requieren lógica
- ✅ Setup específico de librerías
