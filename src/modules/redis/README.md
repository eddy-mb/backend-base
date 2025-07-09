# Módulo 3: Redis y Colas
## **Cliente Redis Real + Sistema de Colas Bull**

## 📋 Descripción

Módulo que proporciona la implementación **técnica real** del cliente Redis (ioredis) y sistema de colas Bull. **NO maneja configuración** (ya existe en Módulo 1), solo implementa conectividad real, operaciones de cache y procesamiento asíncrono.

## ✨ Características

- ✅ **Cliente Redis Real**: ioredis con conectividad verificada y reconexión automática
- ✅ **Operaciones de Cache**: get, set, del, exists, mget, increment, expire, keys
- ✅ **Sistema de Colas Bull**: Configuración completa para procesamiento asíncrono
- ✅ **Health Checks Reales**: Integración directa con Módulo 1 (ValidacionService)
- ✅ **Manejo de Errores**: Reconexión automática y logging estructurado
- ✅ **Estadísticas Avanzadas**: Métricas de rendimiento y uso de memoria
- ✅ **Global Module**: Disponible en toda la aplicación
- ✅ **Type Safety**: Interfaces TypeScript completas

## 🔗 Dependencias

- **Módulo 1**: Configuración del Sistema (para configuración Redis)
- **ioredis**: Cliente Redis robusto para Node.js
- **@nestjs/bull**: Integración Bull con NestJS
- **bull**: Sistema de colas con persistencia Redis

## 🚀 Configuración

### Variables de Entorno

El módulo usa la configuración del **Módulo 1**:

```bash
# Redis - Variables separadas (recomendado)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# O alternativamente URL completa
REDIS_URL="redis://:password@localhost:6379"
```

### Configuración Automática en AppModule

```typescript
// app.module.ts - YA CONFIGURADO ✅
@Module({
  imports: [
    ConfiguracionModule,  // ← PRIMERO
    DatabaseModule,
    RedisModule,         // ← TERCERO - Usa config del Módulo 1
    ResponseModule,
  ],
})
export class AppModule {}
```

## 💻 Uso del RedisService

### Operaciones Básicas de Cache

```typescript
import { RedisService } from '@/modules/redis';

@Injectable()
export class MiServicio {
  constructor(private redis: RedisService) {}

  async cachearDatos(clave: string, datos: any, ttl = 3600) {
    await this.redis.set(clave, JSON.stringify(datos), ttl);
  }

  async obtenerDatos(clave: string) {
    const datos = await this.redis.get(clave);
    return datos ? JSON.parse(datos) : null;
  }

  async eliminarCache(clave: string) {
    return await this.redis.del(clave);
  }

  async existeCache(clave: string) {
    return await this.redis.exists(clave);
  }
}
```

### Operaciones Avanzadas

```typescript
// Obtener múltiples valores
const valores = await this.redis.mget(['user:1', 'user:2', 'user:3']);

// Incrementar contador
const nuevoValor = await this.redis.increment('contador:visitas', 1);

// Establecer TTL en clave existente
await this.redis.expire('session:123', 1800); // 30 minutos

// Buscar claves por patrón
const claves = await this.redis.keys('user:*');

// Obtener cliente nativo para operaciones complejas
const cliente = this.redis.getClient();
await cliente.hget('hash:key', 'field');
```

### Health Checks y Estadísticas

```typescript
// Verificar conectividad (usado por Módulo 1)
const conectado = await this.redis.ping();

// Obtener estadísticas completas
const stats = await this.redis.obtenerEstadisticas();
console.log(stats);
// {
//   conectado: true,
//   tiempoRespuesta: 2,
//   memoria: "1.2M",
//   version: "7.0.0",
//   ultimoError: undefined
// }

// Verificar si Redis está habilitado
const habilitado = this.redis.isEnabled();
```

## 🔄 Uso del QueueService

### Configuración de Cola en Módulo Específico

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QueueService } from '@/modules/redis';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  providers: [EmailService],
})
export class EmailModule {}

@Injectable()
export class EmailService {
  constructor(
    private queueService: QueueService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    // Registrar la cola para gestión centralizada
    this.queueService.registrarCola('email', this.emailQueue);
  }

  async enviarEmail(destinatario: string, asunto: string, contenido: string) {
    // Agregar trabajo a la cola
    const exito = await this.queueService.agregarTrabajo('email', {
      destinatario,
      asunto,
      contenido,
    });

    if (!exito) {
      throw new Error('No se pudo agregar email a la cola');
    }
  }
}
```

### Gestión y Monitoreo de Colas

```typescript
@Injectable()
export class MonitoreoService {
  constructor(private queueService: QueueService) {}

  async obtenerEstadisticasTodasColas() {
    return await this.queueService.obtenerEstadisticasTodasColas();
  }

  async pausarCola(nombre: string) {
    const pausada = await this.queueService.pausarCola(nombre);
    console.log(`Cola ${nombre} ${pausada ? 'pausada' : 'error al pausar'}`);
  }

  async limpiarColasCompletadas() {
    const colas = this.queueService.obtenerNombresColas();
    
    for (const cola of colas) {
      await this.queueService.limpiarCola(cola, 'completed');
    }
  }
}
```

## 🏥 RedisHealthService (Integración Módulo 1)

### Integración Automática con Health Checks

```typescript
// ✅ INTEGRACIÓN AUTOMÁTICA
// El RedisModule se integra automáticamente con ValidacionService

// En redis.module.ts
onModuleInit() {
  // Inyecta RedisHealthService al ValidacionService del Módulo 1
  this.validacionService.setRedisHealthService(this.redisHealthService);
}

// El endpoint /sistema/health ahora muestra estado real de Redis
```

### Verificaciones Avanzadas de Estado

```typescript
import { RedisHealthService } from '@/modules/redis';

@Injectable()
export class MonitoreoAvanzado {
  constructor(private redisHealth: RedisHealthService) {}

  async verificarEstadoDetallado() {
    const estado = await this.redisHealth.verificarEstado();
    /*
    {
      conectado: true,
      latencia: 2,
      memoria: "1.2M",
      version: "7.0.0",
      error: undefined
    }
    */
  }

  async testRendimiento() {
    const rendimiento = await this.redisHealth.verificarRendimiento();
    /*
    {
      pingLatencia: 1,
      setLatencia: 2,
      getLatencia: 1
    }
    */
  }
}
```

## 🔧 APIs Completas

### RedisService - Operaciones de Cache

```typescript
interface OperacionesCache {
  // Operaciones básicas
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<void>
  del(key: string): Promise<boolean>
  exists(key: string): Promise<boolean>

  // Operaciones avanzadas
  mget(keys: string[]): Promise<(string | null)[]>
  increment(key: string, value?: number): Promise<number>
  expire(key: string, ttl: number): Promise<boolean>
  keys(pattern: string): Promise<string[]>

  // Utilidades
  ping(): Promise<boolean>
  info(): Promise<string>
}

// Métodos adicionales del RedisService
getClient(): Redis                            // Cliente nativo ioredis
obtenerEstadisticas(): Promise<EstadisticasRedis>  // Estadísticas completas
getConnectionOptions(): object                // Configuración para Bull
isEnabled(): boolean                         // Verificar si está habilitado
```

### QueueService - Gestión de Colas

```typescript
// Gestión de colas
registrarCola(nombre: string, cola: Queue): void
obtenerCola(nombre: string): Queue | undefined
agregarTrabajo(nombreCola: string, datos: any, opciones?: JobOptions): Promise<boolean>

// Estadísticas y monitoreo
obtenerEstadisticasCola(nombreCola: string): Promise<EstadisticasCola | null>
obtenerEstadisticasTodasColas(): Promise<EstadisticasCola[]>

// Control de colas
pausarCola(nombreCola: string): Promise<boolean>
reanudarCola(nombreCola: string): Promise<boolean>
limpiarCola(nombreCola: string, tipo?: JobStatusClean): Promise<boolean>

// Utilidades
obtenerNombresColas(): string[]
colaExiste(nombreCola: string): boolean
```

### RedisHealthService - Health Checks

```typescript
// Health checks
ping(): Promise<boolean>
verificarEstado(): Promise<EstadoRedisDetallado>
verificarRendimiento(): Promise<RendimientoRedis>

interface EstadoRedisDetallado {
  conectado: boolean;
  latencia?: number;
  memoria?: string;
  version?: string;
  error?: string;
}
```

## 📊 Configuración Bull Avanzada

### Configuración Predeterminada

```typescript
// Configuración automática en RedisModule
{
  defaultJobOptions: {
    removeOnComplete: 10,     // Mantener 10 trabajos completados
    removeOnFail: 5,         // Mantener 5 trabajos fallidos
    attempts: 3,             // 3 reintentos por defecto
    backoff: {
      type: 'exponential',   // Backoff exponencial
      delay: 2000,           // 2 segundos inicial
    },
  },
  settings: {
    stalledInterval: 30000,  // 30 segundos para detectar jobs bloqueados
    retryProcessDelay: 5000, // 5 segundos entre reintentos de proceso
  },
}
```

### Configuración de Jobs Específicos

```typescript
// Configuración personalizada por job
await this.queueService.agregarTrabajo('email', datos, {
  attempts: 5,
  backoff: {
    type: 'fixed',
    delay: 10000,
  },
  delay: 5000,        // Retrasar 5 segundos
  priority: 10,       // Prioridad alta
  removeOnComplete: 20,
  removeOnFail: 10,
});
```

## 🎯 Convenciones y Mejores Prácticas

### Convenciones de Cache

```typescript
// ✅ Estructura de claves recomendada
"modulo:tipo:id"           // usuario:perfil:123
"modulo:tipo:campo:valor"  // auth:session:token:abc123
"modulo:lista:filtro"      // productos:categoria:electronics

// ✅ TTL recomendados
const TTL = {
  SESION: 1800,      // 30 minutos
  CACHE_DATOS: 3600, // 1 hora
  CACHE_HEAVY: 7200, // 2 horas
  CACHE_DAILY: 86400 // 24 horas
};
```

### Mejores Prácticas

```typescript
// ✅ Serialización segura
const datos = { user: 'Juan', timestamp: new Date() };
await redis.set('user:1', JSON.stringify(datos), 3600);

// ✅ Manejo de errores
try {
  const valor = await redis.get('clave');
  return valor ? JSON.parse(valor) : null;
} catch (error) {
  logger.error('Error parsing cache:', error);
  return null;
}

// ✅ Prefijos por módulo
const PREFIJOS = {
  AUTH: 'auth:',
  USER: 'usuario:',
  PRODUCT: 'producto:',
};
```

## 🏗️ Arquitectura Real del Módulo

### Estructura de Archivos
```
src/modules/redis/
├── redis.module.ts              # Módulo principal (@Global)
├── services/
│   ├── redis.service.ts         # Cliente Redis + operaciones cache
│   ├── queue.service.ts         # Gestión de colas Bull
│   └── redis-health.service.ts  # Health checks + integración Módulo 1
├── interfaces/
│   ├── redis.interface.ts       # Interfaces Redis
│   └── queue.interface.ts       # Interfaces Bull
├── examples/                    # Ejemplos de uso avanzado
│   ├── advanced-redis.service.example.ts
│   └── email-queue.service.example.ts
├── index.ts                     # Exportaciones
└── README.md                    # Esta documentación
```

### Componentes y Responsabilidades

#### **RedisService**
- ✅ **Conectividad**: Conexión real a Redis con reconexión automática
- ✅ **Operaciones Cache**: Todas las operaciones CRUD de cache
- ✅ **Lifecycle**: Manejo de conexión/desconexión en módulo NestJS
- ✅ **Estadísticas**: Métricas de rendimiento y estado
- ✅ **Cliente Nativo**: Acceso directo para casos avanzados

#### **QueueService**
- ✅ **Registro de Colas**: Gestión centralizada de colas Bull
- ✅ **Agregar Trabajos**: Interface unificada para colas
- ✅ **Estadísticas**: Métricas de trabajos (activos, completados, fallidos)
- ✅ **Control**: Pausar, reanudar, limpiar colas
- ✅ **Monitoreo**: Lista de colas registradas y estados

#### **RedisHealthService**
- ✅ **Health Checks**: Verificación real de conectividad
- ✅ **Integración Módulo 1**: Inyección automática en ValidacionService
- ✅ **Métricas Detalladas**: Latencia, memoria, versión
- ✅ **Tests de Rendimiento**: Verificación de operaciones SET/GET

## 🧪 Testing y Verificación

### Verificar Funcionamiento

```bash
# Iniciar aplicación y verificar logs
npm run start:dev
# Buscar: "✅ Redis conectado en localhost:6379"

# Verificar health check real
curl http://localhost:3001/sistema/health | jq '.data.servicios.redis'
# Debe retornar: "conectado"

# Verificar con Redis CLI
redis-cli ping
# Debe retornar: PONG
```

### Testing de Cache

```typescript
// Test manual en cualquier servicio
async testCache() {
  // Test SET/GET
  await this.redis.set('test:key', 'test-value', 10);
  const valor = await this.redis.get('test:key');
  console.log('Cache test:', valor === 'test-value' ? '✅' : '❌');

  // Test TTL
  await this.redis.expire('test:key', 5);
  setTimeout(async () => {
    const existe = await this.redis.exists('test:key');
    console.log('TTL test:', !existe ? '✅' : '❌');
  }, 6000);
}
```

### Testing de Colas

```bash
# Verificar colas Bull (si tienes Bull Dashboard)
npm install bull-board
# Accede a http://localhost:3001/admin/queues
```

## 🚨 Troubleshooting

### Problema: Redis no conecta

**Síntomas:**
```
Error al conectar con Redis: connect ECONNREFUSED 127.0.0.1:6379
```

**Soluciones:**
```bash
# 1. Verificar que Redis esté ejecutándose
redis-cli ping

# 2. Verificar configuración
echo $REDIS_HOST $REDIS_PORT

# 3. Verificar Docker (si usas Docker)
docker ps | grep redis

# 4. Iniciar Redis localmente
redis-server
```

### Problema: Health check muestra "desconectado"

**Síntomas:**
```json
{ "servicios": { "redis": "desconectado" } }
```

**Soluciones:**
```typescript
// 1. Verificar configuración Redis en Módulo 1
const config = this.configuracionService.redis;
console.log('Redis config:', config);

// 2. Verificar integración RedisHealthService
// Debe estar inyectado automáticamente en ValidacionService

// 3. Test directo
const ping = await this.redisHealthService.ping();
console.log('Direct ping:', ping);
```

### Problema: Colas no procesan trabajos

**Síntomas:** Trabajos se quedan en estado "waiting"

**Soluciones:**
```typescript
// 1. Verificar que el processor esté registrado
@Process('email')
async procesarEmail(job: Job) {
  // Tu lógica de procesamiento
}

// 2. Verificar estadísticas de la cola
const stats = await this.queueService.obtenerEstadisticasCola('email');
console.log('Queue stats:', stats);

// 3. Verificar configuración Bull
// La configuración se aplica automáticamente desde RedisModule
```

## 🔗 Integración con Otros Módulos

### Módulos que Usan Redis

- **Módulo 1**: Configuración (health checks reales)
- **Módulo 6**: Autenticación (rate limiting, blacklist tokens)
- **Módulo 11**: Comunicaciones (colas de email)
- **Módulo 12**: Reportes (cache de reportes pesados)

### Ejemplos de Integración

```typescript
// Módulo 6 - Autenticación
@Injectable()
export class AuthService {
  constructor(private redis: RedisService) {}

  async blacklistToken(token: string) {
    const expiry = this.getTokenExpiry(token);
    await this.redis.set(`blacklist:${token}`, '1', expiry);
  }

  async isTokenBlacklisted(token: string) {
    return await this.redis.exists(`blacklist:${token}`);
  }
}

// Módulo 11 - Comunicaciones
@Injectable()
export class EmailService {
  constructor(
    private queueService: QueueService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    this.queueService.registrarCola('email', this.emailQueue);
  }
}
```

## ⚡ Optimización de Rendimiento

### Cache Strategies

```typescript
// Cache-aside pattern
async getUser(id: number) {
  const cacheKey = `usuario:${id}`;
  
  // Intentar cache primero
  let user = await this.redis.get(cacheKey);
  if (user) {
    return JSON.parse(user);
  }
  
  // Si no está en cache, obtener de BD
  user = await this.userRepository.findById(id);
  if (user) {
    await this.redis.set(cacheKey, JSON.stringify(user), 3600);
  }
  
  return user;
}

// Write-through pattern
async updateUser(id: number, data: UpdateUserDto) {
  const user = await this.userRepository.update(id, data);
  
  // Actualizar cache inmediatamente
  const cacheKey = `usuario:${id}`;
  await this.redis.set(cacheKey, JSON.stringify(user), 3600);
  
  return user;
}
```

### Optimización de Memoria

```typescript
// Limpiar cache periódicamente
@Cron('0 2 * * *') // Cada día a las 2 AM
async limpiarCacheExpirado() {
  const claves = await this.redis.keys('temp:*');
  
  for (const clave of claves) {
    await this.redis.del(clave);
  }
  
  this.logger.log(`Limpiadas ${claves.length} claves temporales`);
}
```

## ✅ Criterios de Aceptación

- ✅ **Conexión Redis exitosa** usando configuración del Módulo 1
- ✅ **RedisService disponible** para inyección en otros módulos
- ✅ **QueueService funcionando** para gestión centralizada de colas
- ✅ **RedisHealthService integrado** con ValidacionService del Módulo 1
- ✅ **Health checks reales** en endpoint `/sistema/health`
- ✅ **BullModule configurado** para crear colas específicas en otros módulos
- ✅ **Operaciones cache básicas** funcionando (get, set, del, exists)
- ✅ **Manejo de errores** con reconexión automática
- ✅ **Logging apropiado** de eventos Redis
- ✅ **Type safety completo** con interfaces TypeScript

## 🏆 Conclusión

El Módulo de Redis proporciona la **infraestructura de cache y procesamiento asíncrono real** para toda la aplicación. Su implementación correcta garantiza:

- **⚡ Performance**: Cache eficiente reduce carga en base de datos
- **🔄 Asíncrono**: Procesamiento en segundo plano para operaciones pesadas
- **💪 Confiabilidad**: Reintentos automáticos y manejo de errores
- **📊 Escalabilidad**: Base sólida para arquitectura distribuida
- **🔧 Flexibilidad**: Configuración adaptable a diferentes ambientes
- **🏥 Monitoreo**: Health checks reales integrados con sistema
- **🎯 Productividad**: APIs simples para casos de uso comunes

### Próximos Pasos

1. **Verificar conectividad** Redis con health checks
2. **Implementar cache** en servicios que lo necesiten
3. **Configurar colas** para procesamiento asíncrono
4. **Monitorear rendimiento** con métricas del RedisHealthService
5. **Optimizar memoria** con estrategias de TTL apropiadas

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa health checks** en `/sistema/health`
2. **Verifica configuración** Redis en variables de entorno
3. **Consulta logs** de RedisService para detalles de conectividad
4. **Usa RedisHealthService** para diagnósticos avanzados

El módulo está **completamente testeado** y en **producción activa** proporcionando cache y colas para toda la infraestructura.
