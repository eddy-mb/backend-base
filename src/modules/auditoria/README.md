# Módulo 6: Auditoría

## Descripción

Módulo de auditoría para trazabilidad automática de operaciones del sistema con arquitectura limpia y **solo consulta** vía endpoint.

## Características

### 🔍 **Auditoría Automática**
- Decorador `@Auditable()` para marcado simple
- Interceptor global automático 
- Registro asíncrono sin impacto en performance

### 📊 **Solo Consulta**
- **Único endpoint:** `GET /api/v1/auditoria` para consultas
- Filtros avanzados y paginación
- **No endpoints de creación/modificación**

### 🏗️ **Arquitectura Simplificada**
- Repository con solo 2 métodos: `crear()` + `buscarConFiltros()`
- Service con solo: `buscar()` + `registrarAuditoria()`
- Controller con un único endpoint

## Instalación

### 1. Migración
```bash
npm run migration:run
```

### 2. Ya configurado en `app.module.ts`

## Uso del Decorador @Auditable

### Sintaxis Básica
```typescript
@Auditable(options: AuditableOptions)
```

### Campos del AuditableOptions

#### **Obligatorios**
- `tabla: string` - Nombre de la tabla/entidad afectada

#### **Opcionales**
- `accion?: 'CREATE' | 'UPDATE' | 'DELETE'` - Se infiere del método HTTP si no se especifica
- `descripcion?: string` - Descripción personalizada de la operación
- `incluirMetadatos?: boolean` - Incluir metadatos detallados (default: true)

### Ejemplos de Uso

#### Básico (solo tabla requerida)
```typescript
@Post()
@Auditable({ tabla: 'usuarios' })
async crear(@Body() datos: CreateUsuarioDto) {
  return this.usuarioService.crear(datos);
  // Registra: tabla='usuarios', accion='CREATE' (inferido)
}
```

#### Con descripción
```typescript
@Put(':id')
@Auditable({ 
  tabla: 'usuarios', 
  descripcion: 'Actualización de perfil de usuario' 
})
async actualizar(@Param('id') id: number, @Body() datos: any) {
  // Registra con descripción personalizada
}
```

#### Acción explícita
```typescript
@Post('cambiar-password')
@Auditable({ 
  tabla: 'usuarios', 
  accion: 'UPDATE',
  descripcion: 'Cambio de contraseña' 
})
async cambiarPassword(@Body() datos: any) {
  // Fuerza acción UPDATE aunque sea POST
}
```

#### Sin metadatos (operaciones frecuentes)
```typescript
@Get(':id')
@Auditable({ 
  tabla: 'usuarios', 
  accion: 'READ',
  incluirMetadatos: false 
})
async obtener(@Param('id') id: number) {
  // Auditoría liviana sin metadatos completos
}
```

### Decoradores Disponibles
```typescript
import { 
  Auditable,
  AuditableCreate, 
  AuditableUpdate, 
  AuditableDelete,
  AuditableCritical 
} from './modules/auditoria';

@AuditableCreate({ tabla: 'usuarios' })
@AuditableUpdate({ tabla: 'usuarios' })
@AuditableDelete({ tabla: 'usuarios' })
@AuditableCritical({ tabla: 'usuarios', descripcion: 'Operación crítica' })
```

## API - Solo Consulta

### Único Endpoint
```bash
GET /api/v1/auditoria?tabla=usuarios&accion=CREATE&page=1&limit=20
```

### Filtros Disponibles
- `tabla` - Nombre de tabla/entidad
- `usuarioId` - ID del usuario
- `accion` - CREATE, UPDATE, DELETE
- `fechaInicio` - Fecha inicial (ISO)
- `fechaFin` - Fecha final (ISO)
- `idRegistro` - ID del registro afectado
- `correlationId` - ID de correlación
- `page` - Página (default: 1)
- `limit` - Elementos por página (default: 20, max: 100)

### Respuesta
```json
{
  "data": [
    {
      "id": 1,
      "fechaCreacion": "2024-01-15T10:30:00Z",
      "tabla": "usuarios",
      "accion": "CREATE",
      "usuarioId": 1,
      "correlationId": "abc-123-def",
      "metadatos": { ... }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```

## Arquitectura

### Componentes
```
AuditoriaModule
├── AuditoriaRepository    # crear() + buscarConFiltros()
├── AuditoriaService       # buscar() + registrarAuditoria()
├── AuditoriaController    # UN endpoint de consulta
├── AuditoriaInterceptor   # Captura automática
└── @Auditable()          # Decorador + variantes
```

### Flujo
```
1. @Auditable() marca método
2. Interceptor captura ejecución
3. Service registra log (interno)
4. Consulta vía GET /api/v1/auditoria
```

## Entidad AuditoriaLog

### Campos Principales
- `id` - PK autoincremental
- `fechaCreacion` - Timestamp automático
- `tabla` - Entidad afectada
- `idRegistro` - ID del registro
- `accion` - CREATE/UPDATE/DELETE
- `usuarioId` - Usuario (opcional)
- `correlationId` - Tracking
- `ipOrigen` - IP del cliente
- `metadatos` - JSON con detalles

### Índices Optimizados
- `(tabla, fecha_creacion)`
- `(usuario_id, fecha_creacion)`
- `(accion, fecha_creacion)`
- `(correlation_id)`

## Características Técnicas

- **TypeScript estricto** - Sin `any`
- **Performance optimizado** - Fire-and-forget async
- **Repository simplificado** - Solo métodos necesarios
- **Integración con respuestas** - Paginación automática
- **Logging contextual** - Correlation ID para tracking

---

## Uso Final

**Auditoría:** Agregar `@Auditable({ tabla: 'entidad' })` a métodos
**Consulta:** `GET /api/v1/auditoria` con filtros opcionales
**Sin configuración adicional** - Funciona automáticamente