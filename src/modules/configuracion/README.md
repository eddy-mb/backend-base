# Módulo 1: Configuración del Sistema

## **Base Fundamental de Toda la Infraestructura**

## 📋 Descripción

Módulo **base fundamental** que gestiona la configuración técnica del sistema, variables de entorno, conexiones a servicios externos y validación de configuraciones críticas. Es la **piedra angular** de toda la infraestructura.

## ✨ Características

- ✅ **Gestión de Variables de Entorno**: Carga y validación por ambiente
- ✅ **Configuración de Base de Datos**: PostgreSQL con validación completa
- ✅ **Configuración de Redis**: Cache y colas con verificación real
- ✅ **Gestión de Secretos**: Manejo seguro de credenciales y tokens
- ✅ **Servicios Externos**: Email (Resend/SMTP), Storage (Local/S3)
- ✅ **Validación con Zod**: Esquemas estrictos de configuración
- ✅ **Health Checks**: Verificación real de conectividad
- ✅ **Configuración por Ambiente**: dev/staging/production
- ✅ **Global Module**: Disponible en toda la aplicación

## 🚀 Configuración e Instalación

### 1. Variables de Entorno Requeridas

Crea tu archivo `.env` con las variables necesarias:

```bash
# === CONFIGURACIÓN DE BASE DE DATOS ===
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
# O variables separadas:
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASSWORD=password
DB_NAME=database_name
DB_SSL=false

# === CONFIGURACIÓN DE REDIS ===
REDIS_URL="redis://localhost:6379"
# O variables separadas:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# === CONFIGURACIÓN DE APLICACIÓN ===
NODE_ENV=development
PORT=3001
APP_NAME="Sistema Base Individual"
APP_VERSION="1.0.0"
FRONTEND_URL="http://localhost:3000"
API_URL="http://localhost:3001"
LOG_LEVEL=info
TZ="America/La_Paz"

# === CONFIGURACIÓN DE SEGURIDAD ===
JWT_SECRET="tu-jwt-secret-muy-largo-para-seguridad-minimo-32-caracteres"
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET="tu-refresh-secret-muy-largo-para-seguridad"
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY="tu-encryption-key-muy-largo-para-seguridad-minimo-32"
CORS_ORIGIN="*"
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# === SERVICIOS EXTERNOS (OPCIONALES) ===
# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@tudominio.com

# SMTP (alternativo a Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-password

# Storage
STORAGE_PROVIDER=local
STORAGE_PATH=./uploads

# AWS S3 (alternativo a local)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 2. Configuración en AppModule

```typescript
// app.module.ts - YA CONFIGURADO ✅
@Module({
  imports: [
    ConfiguracionModule, // ← PRIMERO - Base fundamental
    DatabaseModule, // ← Depende de ConfiguracionModule
    RedisModule, // ← Depende de ConfiguracionModule
    ResponseModule, // ← Usa BusinessException de respuestas
    // ... otros módulos
  ],
})
export class AppModule {}
```

## 📡 Endpoints Disponibles

### 🔍 Health Check (Público)

```http
GET /sistema/health
```

**Respuesta:**

```json
{
  "data": {
    "sistema": "operativo",
    "version": "1.0.0",
    "ambiente": "development",
    "timestamp": "2024-01-15 10:30:00",
    "servicios": {
      "baseDatos": "conectado",
      "redis": "conectado",
      "email": "operativo"
    }
  }
}
```

### 🔧 Configuración del Sistema (Admin)

```http
GET /sistema/configuracion
Authorization: Bearer {admin-token}
```

**Respuesta:**

```json
{
  "data": {
    "aplicacion": {
      "nombre": "Sistema Base Individual",
      "version": "1.0.0",
      "ambiente": "development"
    },
    "caracteristicas": {
      "email": true,
      "storage": "local",
      "redis": true
    },
    "limites": {
      "rateLimitMax": 100,
      "rateLimitWindow": 900000
    },
    "baseDatos": {
      "host": "localhost",
      "port": 5432,
      "database": "database_name",
      "ssl": false
    },
    "redis": {
      "host": "localhost",
      "port": 6379
    }
  }
}
```

### ✅ Validar Configuración (Admin)

```http
POST /sistema/validar-configuracion
Authorization: Bearer {admin-token}
```

**Respuesta Exitosa:**

```json
{
  "data": {
    "valida": true,
    "errores": [],
    "advertencias": [
      "Redis no configurado - algunas funcionalidades pueden estar limitadas"
    ]
  }
}
```

**Respuesta con Errores:**

```json
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Regla de negocio violada (CONFIGURACION_INVALIDA): La configuración del sistema contiene errores",
    "details": {
      "rule": "CONFIGURACION_INVALIDA",
      "errores": ["JWT_SECRET debe tener al menos 32 caracteres"],
      "advertencias": [
        "CORS configurado para aceptar cualquier origen en producción"
      ]
    }
  }
}
```

### 🌐 Conectividad de Servicios (Admin)

```http
GET /sistema/conectividad
Authorization: Bearer {admin-token}
```

**Respuesta:**

```json
{
  "data": {
    "baseDatos": true,
    "redis": true,
    "email": false
  }
}
```

### ℹ️ Información Básica (Público)

```http
GET /sistema/info
```

**Respuesta:**

```json
{
  "data": {
    "nombre": "Sistema Base Individual",
    "version": "1.0.0",
    "ambiente": "development",
    "timestamp": "2024-01-15 10:30:00"
  }
}
```

## 💻 Uso en Otros Módulos

### Inyección del ConfiguracionService

```typescript
import { ConfiguracionService } from '@/modules/configuracion';

@Injectable()
export class MiServicio {
  constructor(private configuracionService: ConfiguracionService) {}

  async ejemplo() {
    // Acceder a configuraciones específicas
    const dbConfig = this.configuracionService.baseDatos;
    const redisConfig = this.configuracionService.redis;
    const appConfig = this.configuracionService.aplicacion;
    const securityConfig = this.configuracionService.seguridad;

    // Verificar características habilitadas
    const emailHabilitado =
      this.configuracionService.caracteristicaHabilitada('email');
    const s3Habilitado =
      this.configuracionService.caracteristicaHabilitada('s3');

    // Obtener configuración pública (sin datos sensibles)
    const configPublica =
      this.configuracionService.obtenerConfiguracionPublica();
  }
}
```

### Configuraciones Disponibles

```typescript
// Base de datos
interface ConfiguracionBaseDatos {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
  url: string; // Para compatibilidad con DATABASE_URL
}

// Redis
interface ConfiguracionRedis {
  url?: string;
  host: string;
  port: number;
  password?: string;
}

// Aplicación
interface ConfiguracionAplicacion {
  nombre: string;
  version: string;
  ambiente: string;
  puerto: number;
  frontendUrl: string;
  apiUrl: string;
  logLevel: string;
  timeZone: string;
}

// Seguridad
interface ConfiguracionSeguridad {
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret?: string;
  jwtRefreshExpiresIn: string;
  encryptionKey: string;
  corsOrigin: string;
  rateLimitMax: number;
  rateLimitWindow: number;
}

// Email
interface ConfiguracionEmail {
  provider: 'resend' | 'smtp';
  resendApiKey?: string;
  emailFrom?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}

// Storage
interface ConfiguracionStorage {
  provider: 'local' | 's3';
  storagePath?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  awsS3Bucket?: string;
}
```

## 🔒 Seguridad y Validación

### Validación con Zod

El módulo usa **Zod** para validación estricta de todas las variables de entorno:

```typescript
// Validaciones aplicadas automáticamente:
- DATABASE_URL: debe ser URL válida
- JWT_SECRET: mínimo 32 caracteres
- ENCRYPTION_KEY: mínimo 32 caracteres
- EMAIL: formato de email válido
- PORTS: números entre 1000-65535
- FRONTEND_URL/API_URL: URLs válidas
```

### Variables Obligatorias

**❌ Faltantes causan error de inicio:**

- `DATABASE_URL` o configuración DB completa
- `FRONTEND_URL`
- `API_URL`
- `JWT_SECRET` (mínimo 32 caracteres)
- `ENCRYPTION_KEY` (mínimo 32 caracteres)

### Variables Opcionales

**✅ Tienen valores por defecto:**

- `NODE_ENV` → `development`
- `PORT` → `3001`
- `LOG_LEVEL` → `info`
- `TZ` → `America/La_Paz`
- `CORS_ORIGIN` → `*`
- `RATE_LIMIT_MAX` → `100`
- `STORAGE_PROVIDER` → `local`

## 🧪 Health Checks y Monitoreo

### Verificación Real de Servicios

El módulo realiza **verificaciones reales** de conectividad:

```typescript
// En ValidacionService (migrado a TypeORM)
async verificarSaludSistema() {
  const servicios = {
    baseDatos: await this.verificarBaseDatos(),    // Query real via TypeORM DataSource
    redis: await this.verificarRedis(),           // PING real a Redis
    email: this.verificarEmail(),                 // Verificación de configuración
  };
  // ...
}

// Verificación de base de datos con TypeORM
private async verificarBaseDatos(): Promise<'conectado' | 'desconectado'> {
  try {
    await this.dataSource.query('SELECT 1'); // ← TypeORM DataSource
    return 'conectado';
  } catch (error) {
    return 'desconectado';
  }
}
```

### Estados de Servicios

- **🟢 `conectado`/`operativo`**: Servicio funcionando correctamente
- **🔴 `desconectado`/`inoperativo`**: Servicio no disponible

### Integración con RedisModule

```typescript
// El módulo se integra automáticamente con RedisHealthService
setRedisHealthService(redisHealthService: IRedisHealthService): void {
  this.redisHealthService = redisHealthService;
}
```

## 🏗️ Arquitectura del Módulo

### Estructura de Archivos

```
src/modules/configuracion/
├── configuracion.module.ts       # Módulo principal (@Global)
├── controllers/
│   └── sistema.controller.ts     # Endpoints de sistema
├── services/
│   ├── configuracion.service.ts  # Servicio principal
│   └── validacion.service.ts     # Health checks y validación
├── guards/
│   └── configuracion.guard.ts    # Protección endpoints admin
├── interfaces/
│   └── configuracion.interface.ts # Interfaces TypeScript
├── schemas/
│   └── configuracion.schema.ts   # Esquemas Zod
└── README.md                     # Esta documentación
```

### Responsabilidades por Componente

#### **ConfiguracionService**

- ✅ Carga y validación de variables de entorno
- ✅ Getters tipados para cada tipo de configuración
- ✅ Método `caracteristicaHabilitada()`
- ✅ Configuración pública sin datos sensibles

#### **ValidacionService**

- ✅ Health checks de servicios (BD, Redis, Email)
- ✅ Validación completa de configuración
- ✅ Verificación de conectividad real
- ✅ Integración con RedisHealthService

#### **SistemaController**

- ✅ Endpoints públicos (`/health`, `/info`)
- ✅ Endpoints admin (`/configuracion`, `/validar-configuracion`, `/conectividad`)
- ✅ Integración con ResponseModule (formato `{ data: ... }`)
- ✅ Uso de `BusinessException` para errores

#### **ConfiguracionGuard**

- ✅ Protección de endpoints administrativos
- ✅ Verificación de permisos de administrador

## 🔧 Configuración por Ambiente

### Desarrollo

```bash
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=*
DB_SSL=false
```

### Staging

```bash
NODE_ENV=staging
LOG_LEVEL=info
CORS_ORIGIN=https://staging.tudominio.com
DB_SSL=true
```

### Producción

```bash
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://tudominio.com
DB_SSL=true
RATE_LIMIT_MAX=1000
```

## 🚨 Troubleshooting

### Error: "Configuración inválida"

**Síntomas:** Aplicación no inicia

```
Error al cargar configuración: Configuración inválida: JWT_SECRET: String must contain at least 32 character(s)
```

**Solución:**

1. Verificar que `JWT_SECRET` tenga mínimo 32 caracteres
2. Verificar que `ENCRYPTION_KEY` tenga mínimo 32 caracteres
3. Verificar que URLs sean válidas (`DATABASE_URL`, `FRONTEND_URL`, `API_URL`)

### Error: "Base de datos desconectada"

**Síntomas:** Health check muestra `baseDatos: "desconectado"`

**Solución:**

1. Verificar que PostgreSQL esté ejecutándose
2. Verificar credenciales en `DATABASE_URL`
3. Verificar conectividad de red
4. Revisar logs para detalles específicos

### Error: "Redis desconectado"

**Síntomas:** Health check muestra `redis: "desconectado"`

**Solución:**

1. Verificar que Redis esté ejecutándose
2. Verificar `REDIS_HOST` y `REDIS_PORT`
3. Verificar `REDIS_PASSWORD` si aplica
4. Verificar que RedisModule esté importado después de ConfiguracionModule

### Advertencias en Producción

**Mensaje:** `CORS configurado para aceptar cualquier origen en producción`

**Solución:** Configurar `CORS_ORIGIN` con dominio específico:

```bash
CORS_ORIGIN=https://tudominio.com
```

## 📊 Validaciones Automáticas

### Al Inicio de la Aplicación

- ✅ **Variables obligatorias** presentes
- ✅ **Formatos válidos** (URLs, emails, números)
- ✅ **Longitudes mínimas** (secretos de 32+ caracteres)
- ✅ **Conectividad** a servicios externos

### En Tiempo de Ejecución

- ✅ **Health checks** cada vez que se consulta `/sistema/health`
- ✅ **Validación completa** cuando se llama `/sistema/validar-configuracion`
- ✅ **Verificación de conectividad** en `/sistema/conectividad`

## 🧪 Testing

### Verificar Configuración

```bash
# Comprobar que la aplicación inicia sin errores
npm run start:dev

# Verificar health check
curl http://localhost:3001/sistema/health | jq '.data.servicios'

# Verificar información básica
curl http://localhost:3001/sistema/info | jq '.data'
```

### Testing con Variables de Entorno

```bash
# Probar con configuración mínima
DATABASE_URL="postgresql://test:test@localhost:5432/test" \
FRONTEND_URL="http://localhost:3000" \
API_URL="http://localhost:3001" \
JWT_SECRET="test-jwt-secret-muy-largo-para-testing-32-chars" \
ENCRYPTION_KEY="test-encryption-key-muy-largo-testing-32" \
npm run start:dev
```

## 📈 Mejores Prácticas

### Gestión de Secretos

✅ **Usar variables de entorno** para todos los secretos

```bash
# ✅ Correcto
JWT_SECRET="secreto-muy-largo-y-seguro-minimo-32-caracteres"

# ❌ Incorrecto
JWT_SECRET="123"
```

✅ **Rotar secretos regularmente** en producción

✅ **Usar servicios de gestión de secretos** (AWS Secrets Manager, etc.)

### Configuración por Ambiente

✅ **Separar configuraciones** por ambiente

```bash
# Archivos separados
.env.development
.env.staging
.env.production
```

✅ **Validar configuraciones** específicas por ambiente

✅ **Documentar variables** requeridas para cada ambiente

### Monitoreo y Alertas

✅ **Monitorear health checks** automáticamente

✅ **Alertas** cuando servicios se desconectan

✅ **Logs estructurados** para debugging

## 🔗 Integración con Otros Módulos

### Módulos que Dependen

- **Módulo 2**: Database (usa configuración de BD)
- **Módulo 3**: Redis (usa configuración de Redis)
- **Módulo 4**: Respuestas (usa BusinessException)
- **Módulo 5**: Observabilidad (usa configuración de logs)
- **Módulo 6**: Autenticación (usa configuración JWT)
- **Módulos 7-12**: Todos usan ConfiguracionService

### Orden de Inicialización

```
1. ConfiguracionModule  ← PRIMERO (base fundamental)
2. DatabaseModule       ← Usa config de BD
3. RedisModule         ← Usa config de Redis
4. ResponseModule      ← Independiente pero se integra
5. Resto de módulos    ← Usan ConfiguracionService
```

## ✅ Criterios de Aceptación

- ✅ **Carga exitosa** de todas las variables requeridas
- ✅ **Validación Zod** pasa sin errores
- ✅ **Health checks** funcionan correctamente
- ✅ **Endpoints públicos** accesibles sin autenticación
- ✅ **Endpoints admin** protegidos con guard
- ✅ **Integración ResponseModule** con formato `{ data: ... }`
- ✅ **Uso de BusinessException** para errores de negocio
- ✅ **Configuración global** disponible en toda la app
- ✅ **Type safety** completo con interfaces TypeScript
- ✅ **Logging apropiado** de eventos de configuración

## 🏆 Conclusión

El Módulo de Configuración es la **piedra angular** de toda la infraestructura. Su correcta configuración garantiza:

- **🔒 Seguridad**: Validación rigurosa de configuraciones críticas
- **🌍 Flexibilidad**: Adaptación a diferentes ambientes
- **💪 Robustez**: Detección temprana de problemas de configuración
- **🔧 Mantenibilidad**: Gestión centralizada de configuraciones
- **📊 Observabilidad**: Health checks y monitoreo integrado
- **⚡ Performance**: Configuración cached y optimizada

### Próximos Pasos

1. **Configurar variables** de entorno según tu ambiente
2. **Verificar health checks** que todos los servicios estén conectados
3. **Implementar monitoring** de endpoints de salud
4. **Configurar alertas** para servicios críticos
5. **Documentar secretos** y procedimientos de rotación

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs** de la aplicación al iniciar
2. **Verifica variables de entorno** con el endpoint `/sistema/validar-configuracion`
3. **Consulta health checks** en `/sistema/health`
4. **Revisa conectividad** en `/sistema/conectividad`

El módulo está **completamente testeado** y en **producción activa** sirviendo como base para todos los demás módulos del sistema.
