# Módulo 5: Logging

Sistema de logging estructurado con Winston que reutiliza la configuración validada del Módulo 1.

## 🚀 Características

- **Winston** configurado automáticamente por ambiente
- **API compatible** con Logger de NestJS para migración gradual
- **Transports automáticos**: Console (dev) y Archivos (prod)
- **Rotación automática** de archivos con configuración validada
- **Metadatos enriquecidos** para contexto adicional
- **Lifecycle management** completo

## 📦 Instalación

```bash
npm install winston winston-daily-rotate-file
```

## 🔧 Configuración

El módulo **NO requiere configuración adicional**. Usa la configuración Winston validada del Módulo 1:

```bash
# Variables de entorno (YA configuradas en Módulo 1)
LOG_LEVEL=info                         # Nivel de logging
WINSTON_MAX_FILES=14d                  # Retención de archivos
WINSTON_MAX_SIZE=20m                   # Tamaño máximo por archivo
WINSTON_LOG_DIR=./logs                 # Directorio de logs
WINSTON_CONSOLE_ENABLED=true           # Logs en consola
# WINSTON_FILE_ENABLED comentado       # Se infiere por NODE_ENV
WINSTON_DATE_PATTERN=YYYY-MM-DD        # Patrón de fecha
WINSTON_ERROR_FILE_ENABLED=true        # Archivo separado para errores
```

### Configuración Automática por Ambiente

| Ambiente | Console | Files | Nivel | Uso |
|----------|---------|-------|-------|-----|
| `development` | ✅ `true` | ❌ `false` | `debug` | Desarrollo local |
| `staging` | ✅ `true` | ✅ `true` | `info` | Testing |
| `production` | ❌ `false` | ✅ `true` | `info/warn` | Producción |

## 🎯 Uso Básico

### Migración Gradual desde Logger de NestJS

```typescript
// ANTES (mantener si funciona)
@Injectable()
export class UsuarioService {
  constructor(private logger: Logger) {}
  
  async crearUsuario(datos: CreateUserDto) {
    this.logger.log('Creando usuario', UsuarioService.name);
    // ...
  }
}

// DESPUÉS (migrar gradualmente)
@Injectable()
export class UsuarioService {
  constructor(private loggerService: LoggerService) {}
  
  async crearUsuario(datos: CreateUserDto) {
    // API compatible
    this.loggerService.log('Creando usuario', UsuarioService.name);
    
    // Con metadatos enriquecidos
    this.loggerService.logWithMeta('Creando usuario', {
      email: datos.email,
      correlationId: 'uuid-123',
      module: 'UsuarioService',
      method: 'crearUsuario'
    });
  }
}
```

### API Compatible con NestJS Logger

```typescript
// Métodos básicos (compatibles con Logger de NestJS)
loggerService.log('Mensaje informativo', 'MiContexto');
loggerService.error('Error ocurrido', error.stack, 'MiContexto');
loggerService.warn('Advertencia', 'MiContexto');
loggerService.debug('Debug info', 'MiContexto');
loggerService.verbose('Verbose info', 'MiContexto');
```

### API Extendida con Metadatos

```typescript
// Logging con metadatos enriquecidos
loggerService.logWithMeta('Usuario autenticado', {
  userId: 123,
  email: 'usuario@email.com',
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  correlationId: 'req-uuid-123',
  duration: 150 // ms
});

loggerService.errorWithMeta('Error en base de datos', {
  query: 'SELECT * FROM usuarios',
  error: error.message,
  stack: error.stack,
  correlationId: 'req-uuid-123'
});
```

## 🔄 Configuración por Ambiente

### Desarrollo (`NODE_ENV=development`)
```bash
NODE_ENV=development
LOG_LEVEL=debug                    # Más verboso para debugging
WINSTON_CONSOLE_ENABLED=true       # Logs visibles en terminal
# WINSTON_FILE_ENABLED comentado   # false automático = más rápido
```
- **Console logging**: Formato colorizado y legible
- **File logging**: Deshabilitado (más rápido)
- **Nivel**: `debug` (más detallado)

### Producción (`NODE_ENV=production`) 
```bash
NODE_ENV=production
LOG_LEVEL=info                     # Menos verboso
WINSTON_CONSOLE_ENABLED=false      # Sin logs en consola
# WINSTON_FILE_ENABLED comentado   # true automático = persistencia
```
- **Console logging**: Deshabilitado (sin ruido)
- **File logging**: JSON estructurado con rotación
- **Archivos**: combined.log + error.log
- **Nivel**: `info` o `warn` (solo importante)

## 📁 Estructura de Logs

```
logs/
├── combined-2024-01-15.log    # Todos los logs
├── error-2024-01-15.log       # Solo errores
├── current.log -> combined-2024-01-15.log  # Symlink al actual
└── ...
```

## 🛠️ Utilidades

```typescript
// Verificar configuración
if (loggerService.isConfigured()) {
  console.log('Winston configurado correctamente');
}

// Obtener configuración actual
const config = loggerService.getConfiguration();

// Forzar flush de logs pendientes
await loggerService.flush();
```

## 🎯 Casos de Uso Comunes

### Request Logging
```typescript
@Injectable()
export class MiService {
  constructor(private loggerService: LoggerService) {}
  
  async procesarRequest(req: Request) {
    const correlationId = req.headers['x-correlation-id'] || uuid();
    
    this.loggerService.logWithMeta('Request iniciado', {
      correlationId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    const startTime = Date.now();
    
    try {
      const resultado = await this.procesarLogica();
      
      this.loggerService.logWithMeta('Request completado', {
        correlationId,
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return resultado;
    } catch (error) {
      this.loggerService.errorWithMeta('Request falló', {
        correlationId,
        duration: Date.now() - startTime,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}
```

### Performance Monitoring
```typescript
async miFuncionCostosa() {
  const startTime = Date.now();
  
  try {
    const resultado = await operacionCostosa();
    
    this.loggerService.logWithMeta('Operación completada', {
      operation: 'miFuncionCostosa',
      duration: Date.now() - startTime,
      status: 'success'
    });
    
    return resultado;
  } catch (error) {
    this.loggerService.errorWithMeta('Operación falló', {
      operation: 'miFuncionCostosa',
      duration: Date.now() - startTime,
      error: error.message
    });
    throw error;
  }
}
```

## 📊 Beneficios vs Logger de NestJS

| Característica | Logger NestJS | LoggerService |
|----------------|---------------|---------------|
| API familiar | ✅ | ✅ |
| Configuración | Manual | Automática |
| Metadatos | Limitado | Completo |
| Rotación archivos | ❌ | ✅ |
| Formato JSON | ❌ | ✅ |
| Performance | Básico | Optimizado |
| Transports | Console | Console + File |

## 🔧 Scripts Útiles

```json
{
  "scripts": {
    "logs:clean": "find ./logs -name '*.log' -mtime +30 -delete",
    "logs:view:error": "tail -f ./logs/error-$(date +%Y-%m-%d).log",
    "logs:view:combined": "tail -f ./logs/combined-$(date +%Y-%m-%d).log",
    "logs:search": "grep -r",
    "logs:stats": "wc -l ./logs/*.log"
  }
}
```

### Comandos de Monitoreo

```bash
# Ver logs combinados en tiempo real
npm run logs:view:combined

# Ver solo errores en tiempo real
npm run logs:view:error

# Estadísticas de archivos de log
npm run logs:stats

# Buscar en logs (agregar término después)
npm run logs:search "error de conexión"

# Limpiar logs antiguos (>30 días)
npm run logs:clean
```

## 🎯 Migration Path

1. **Mantener** Logger actual funcionando
2. **Inyectar** LoggerService en servicios nuevos
3. **Migrar gradualmente** servicios críticos
4. **Aprovechar** metadatos en nuevas funcionalidades
5. **Opcional**: Migrar servicios restantes

## ⚡ Performance

- **Asíncrono**: No bloquea operaciones principales
- **Buffering**: Winston maneja buffering automático
- **Rotación**: Automática sin impacto en performance
- **Memory**: Gestión eficiente de memoria
- **CPU**: Minimal overhead (~1-2ms por log)

## 🔧 Troubleshooting

### No veo logs en consola
- Verifica `WINSTON_CONSOLE_ENABLED=true` en `.env`
- En producción es normal que esté en `false`

### No se crean archivos de log
- Verifica que `NODE_ENV=staging` o `NODE_ENV=production`
- O agrega `WINSTON_FILE_ENABLED=true` manualmente
- Verifica permisos de escritura en `WINSTON_LOG_DIR`

### Los logs aparecen duplicados
- Asegúrate de no usar LoggerService Y Logger de NestJS simultáneamente
- La migración debe ser gradual, un servicio a la vez

### Nivel de log incorrecto
- El `currentLevel` viene de `LOG_LEVEL` en `.env`
- Valores válidos: `error`, `warn`, `info`, `debug`

### Archivos de log muy grandes
- Ajusta `WINSTON_MAX_SIZE` (ej: `10m`, `50m`)
- Ajusta `WINSTON_MAX_FILES` (ej: `7d`, `30d`)
- Usa `npm run logs:clean` regularmente
