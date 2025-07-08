# Módulo 3: Redis y Colas

Este módulo proporciona la implementación técnica del cliente Redis y sistema de colas Bull para la infraestructura base.

## Características

- ✅ Cliente Redis con ioredis para máximo rendimiento
- ✅ Operaciones básicas de cache (get, set, del, exists, mget, increment)
- ✅ Sistema de colas Bull para procesamiento asíncrono
- ✅ Manejo automático de conexión y reconexión
- ✅ Logging estructurado de eventos
- ✅ Integración con health checks del sistema
- ✅ Configuración por ambiente desde Módulo 1

## Dependencias

- **Módulo 1**: Configuración del Sistema (para configuración Redis)
- **ioredis**: Cliente Redis robusto
- **@nestjs/bull**: Integración Bull con NestJS
- **bull**: Sistema de colas

## Variables de Entorno Requeridas

```bash
# Redis - Variables separadas
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# O alternativamente URL completa
REDIS_URL="redis://:password@localhost:6379"
```

## Uso Básico

### Operaciones de Cache

```typescript
@Injectable()
export class MiServicio {
  constructor(private redis: RedisService) {}

  async cachearDatos(clave: string, datos: any) {
    await this.redis.set(clave, JSON.stringify(datos), 3600); // TTL 1 hora
  }

  async obtenerDatos(clave: string) {
    const datos = await this.redis.get(clave);
    return datos ? JSON.parse(datos) : null;
  }
}
```

### Colas de Trabajo

```typescript
@Injectable()
export class EmailService {
  constructor(
    private queueService: QueueService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    // Registrar la cola al inicializar
    this.queueService.registrarCola('email', this.emailQueue);
  }

  async enviarEmail(destinatario: string, asunto: string, contenido: string) {
    await this.queueService.agregarTrabajo('email', {
      destinatario,
      asunto,
      contenido,
    });
  }
}
```

### Health Checks

```typescript
// El RedisService se integra automáticamente con los health checks
const conectado = await this.redis.ping();
const estadisticas = await this.redis.obtenerEstadisticas();
```

## Convenciones de Cache

- **Claves**: `modulo:tipo:id` (ej: `usuario:perfil:123`)
- **TTL por defecto**: 3600 segundos (1 hora)
- **Prefijos**: Usar nombres de módulo para evitar colisiones

## Configuración Bull

- **removeOnComplete**: 10 trabajos mantenidos
- **removeOnFail**: 5 trabajos fallidos mantenidos
- **attempts**: 3 reintentos por defecto
- **backoff**: Exponencial con 2 segundos de delay inicial

## API del RedisService

### Operaciones Básicas
- `get(key: string): Promise<string | null>`
- `set(key: string, value: string, ttl?: number): Promise<void>`
- `del(key: string): Promise<boolean>`
- `exists(key: string): Promise<boolean>`

### Operaciones Avanzadas
- `mget(keys: string[]): Promise<(string | null)[]>`
- `increment(key: string, value?: number): Promise<number>`
- `expire(key: string, ttl: number): Promise<boolean>`
- `keys(pattern: string): Promise<string[]>`

### Utilidades
- `ping(): Promise<boolean>` - Health check
- `info(): Promise<string>` - Información del servidor
- `getClient(): Redis` - Cliente nativo para casos avanzados
- `obtenerEstadisticas(): Promise<EstadisticasRedis>`

## API del QueueService

### Gestión de Colas
- `registrarCola(nombre: string, cola: Queue): void`
- `obtenerCola(nombre: string): Queue | undefined`
- `agregarTrabajo(nombreCola: string, datos: any, opciones?: any): Promise<boolean>`

### Estadísticas y Control
- `obtenerEstadisticasCola(nombreCola: string): Promise<EstadisticasCola | null>`
- `pausarCola(nombreCola: string): Promise<boolean>`
- `reanudarCola(nombreCola: string): Promise<boolean>`
- `limpiarCola(nombreCola: string, tipo?: string): Promise<boolean>`

## Arquitectura

```
RedisModule
├── RedisService (operaciones cache)
├── QueueService (utilidades colas)
└── BullModule (configuración base)
```

## Integración con Otros Módulos

Este módulo es utilizado por:
- **Módulo 6**: Autenticación (rate limiting, blacklist tokens)
- **Módulo 11**: Comunicaciones (colas de email)
- **Módulo 12**: Reportes (cache de reportes)

## Testing

Ejecutar pruebas específicas del módulo:

```bash
npm run test -- --testPathPattern=redis
npm run test:cov -- --testPathPattern=redis
```

## Troubleshooting

### Problemas Comunes

1. **Error de conexión Redis**
   ```bash
   # Verificar que Redis esté ejecutándose
   redis-cli ping
   
   # Verificar configuración
   echo $REDIS_HOST $REDIS_PORT
   ```

2. **Trabajos en cola no se procesan**
   ```typescript
   // Verificar estadísticas de la cola
   const stats = await queueService.obtenerEstadisticasCola('mi-cola');
   console.log(stats);
   ```

3. **Alto uso de memoria Redis**
   ```typescript
   // Limpiar claves expiradas
   await redis.keys('*').then(keys => {
     // Revisar patrones de uso
   });
   ```

## Extensión para Casos Específicos

```typescript
// Para casos avanzados, extender el servicio
@Injectable()
export class AdvancedRedisService extends RedisService {
  async hget(key: string, field: string): Promise<string | null> {
    return this.getClient().hget(key, field);
  }
  
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.getClient().zrange(key, start, stop);
  }
}
```
