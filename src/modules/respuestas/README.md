# Módulo 4: Respuestas Estandarizadas
## **Formato Consistente con Wrapper { data: ... }**

## Descripción

Módulo que implementa un formato consistente para todas las respuestas HTTP usando wrapper `{ data: ... }` para máxima predictibilidad y uniformidad en la API.

## Características

- ✅ **Formato Consistente**: Todas las respuestas exitosas usan `{ data: ... }`
- ✅ **Paginación Automática**: Decorador `@UsePagination()` para listas con metadatos
- ✅ **Manejo de Errores Unificado**: Un solo filtro que captura todas las excepciones
- ✅ **Integración class-validator**: Conversión automática de errores de validación
- ✅ **Configuración Cero**: Funciona inmediatamente sin setup adicional
- ✅ **Factory Methods**: Excepciones con métodos de creación intuitivos
- ✅ **Type Safety**: Tipado completo con TypeScript

## Instalación y Uso

### 1. Importar el Módulo

```typescript
// app.module.ts
import { ResponseModule } from '@/modules/respuestas';

@Module({
  imports: [
    ResponseModule, // Auto-configuración global - ¡Ya está!
  ],
})
export class AppModule {}
```

### 2. Uso en Controladores

#### Respuesta de Entidad Única
```typescript
@Controller('usuarios')
export class UsuarioController {
  @Get(':id')
  async obtenerUsuario(@Param('id') id: number) {
    return this.usuarioService.buscarPorId(id); // Retorna entidad directamente
  }
}

// Respuesta HTTP automática:
// {
//   "data": {
//     "id": 123,
//     "nombre": "Juan Pérez",
//     "email": "juan@ejemplo.com"
//   }
// }
```

#### Lista Simple
```typescript
@Get()
async listarUsuarios() {
  return this.usuarioService.obtenerTodos(); // Retorna array directamente
}

// Respuesta HTTP automática:
// {
//   "data": [
//     { "id": 1, "nombre": "Usuario 1" },
//     { "id": 2, "nombre": "Usuario 2" }
//   ]
// }
```

#### Lista Paginada
```typescript
@Get()
@UsePagination() // ← Decorador mágico
async listarUsuariosPaginados(@Query() params: any) {
  return this.usuarioService.listarPaginado(params);
}

// Respuesta HTTP automática:
// {
//   "data": [
//     { "id": 1, "nombre": "Usuario 1" },
//     { "id": 2, "nombre": "Usuario 2" }
//   ],
//   "pagination": {
//     "total": 150,
//     "page": 2,
//     "limit": 10,
//     "total_pages": 15,
//     "has_next": true,
//     "has_previous": true
//   }
// }
```

### 3. Manejo de Errores (Sin cambios)

#### Errores de Validación (Automático)
```typescript
export class CrearUsuarioDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  nombre: string;
}

// Se convierte automáticamente a:
// {
//   "error": {
//     "code": "VALIDATION_ERROR",
//     "message": "Los datos proporcionados no son válidos",
//     "details": {
//       "errors": [
//         {
//           "field": "email",
//           "message": "Email debe ser válido",
//           "code": "INVALID_EMAIL",
//           "value": "email-invalido"
//         }
//       ]
//     }
//   }
// }
```

#### Errores de Negocio
```typescript
// En servicios
if (!usuario) {
  throw BusinessException.notFound('Usuario', id);
}

if (await this.existeEmail(email)) {
  throw BusinessException.alreadyExists('Usuario', 'email', email);
}

// Factory methods disponibles:
BusinessException.notFound(resource, id)
BusinessException.alreadyExists(resource, field, value)
BusinessException.operationNotAllowed(operation, reason)
BusinessException.insufficientFunds(current, required)
BusinessException.invalidState(current, allowed, resource)
BusinessException.conflict(resource, reason)
BusinessException.businessRuleViolation(rule, message, details)
```

## Utilidades de Paginación (Sin cambios)

### En Servicios
```typescript
@Injectable()
export class UsuarioService {
  async listarPaginado(queryParams: any) {
    // Extraer parámetros de paginación
    const paginationParams = PaginationUtils.fromQuery(queryParams);
    
    // Configurar Prisma
    const prismaConfig = PaginationUtils.toPrismaConfig(paginationParams);
    
    // Consultar datos
    const [data, total] = await Promise.all([
      this.prisma.usuario.findMany({
        ...prismaConfig,
        where: { /* filtros */ },
      }),
      this.prisma.usuario.count({ where: { /* filtros */ } }),
    ]);

    // Retornar resultado paginado
    return PaginationUtils.createResult(data, total);
  }
}
```

## Tipos TypeScript

### Interfaces Principales

```typescript
// Respuesta estándar con wrapper
interface StandardResponse<T> {
  data: T;
}

// Respuesta paginada
interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Metadatos de paginación
interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

// Error estándar (sin cambios)
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

## Ventajas del Formato Consistente

### Para Desarrolladores
- **Parsing Uniforme**: Siempre `response.data` en clientes
- **Predictibilidad**: No hay que adivinar la estructura
- **Type Safety**: Un solo tipo de respuesta para manejar
- **Extensibilidad**: Fácil agregar metadata global

### Para APIs
- **Consistencia Total**: Mismo formato para todas las respuestas exitosas
- **Mantenibilidad**: Una sola lógica de parsing en cliente
- **Escalabilidad**: Fácil evolución sin breaking changes
- **Standards**: Muchas APIs empresariales usan este patrón

### Para Clientes Frontend
```javascript
// JavaScript/TypeScript - Parsing uniforme
const response = await fetch('/api/usuarios/1');
const json = await response.json();
const user = json.data;  // Siempre aquí

// Para listas
const listResponse = await fetch('/api/usuarios');
const listJson = await listResponse.json();
const users = listJson.data;  // Siempre aquí

// Para paginadas
const pagedResponse = await fetch('/api/usuarios?page=1');
const pagedJson = await pagedResponse.json();
const users = pagedJson.data;        // Datos
const pagination = pagedJson.pagination;  // Metadatos
```

## Ejemplos de Respuestas

### Éxito - Entidad Única
```json
{
  "data": {
    "id": 123,
    "nombre": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "fechaCreacion": "2024-01-15T10:30:00Z"
  }
}
```

### Éxito - Lista Simple
```json
{
  "data": [
    { "id": 1, "nombre": "Usuario 1" },
    { "id": 2, "nombre": "Usuario 2" }
  ]
}
```

### Éxito - Lista Paginada
```json
{
  "data": [
    { "id": 21, "nombre": "Usuario 21" },
    { "id": 22, "nombre": "Usuario 22" }
  ],
  "pagination": {
    "total": 150,
    "page": 2,
    "limit": 10,
    "total_pages": 15,
    "has_next": true,
    "has_previous": true
  }
}
```

### Error - Validación (Sin cambios)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Email debe ser válido",
          "code": "INVALID_EMAIL",
          "value": "email-invalido"
        }
      ]
    }
  }
}
```

## Comparación con Formato Anterior

### **ANTES (Datos Directos):**
```json
// Inconsistente - diferentes estructuras
{ "id": 1, "nombre": "Juan" }                    // Entidad
[{ "id": 1 }, { "id": 2 }]                       // Lista
{ "data": [...], "pagination": {...} }           // Paginada
```

### **AHORA (Wrapper Consistente):**
```json
// Consistente - siempre mismo patrón
{ "data": { "id": 1, "nombre": "Juan" } }        // Entidad
{ "data": [{ "id": 1 }, { "id": 2 }] }           // Lista  
{ "data": [...], "pagination": {...} }           // Paginada
```

## Testing

### Ejecutar Pruebas
```bash
# Pruebas unitarias del módulo
npm test -- respuestas

# Iniciar servidor para pruebas manuales
npm run start:dev

# Ver documentación interactiva
# http://localhost:3001/api/docs
```

### Validar Respuestas
```bash
# Todas deben tener wrapper { data: ... }
curl http://localhost:3001/api/v1/test-responses/user/1 | jq '.data'
curl http://localhost:3001/api/v1/test-responses/users/simple | jq '.data'
curl "http://localhost:3001/api/v1/test-responses/users/paginated" | jq '.data, .pagination'
```

## Migración desde Formato Anterior

Si migras desde el formato "datos directos", solo necesitas actualizar el parsing en clientes:

```javascript
// ANTES
const user = response;  // Datos directos
const users = response; // Array directo

// AHORA  
const user = response.data;  // Wrapper consistente
const users = response.data; // Wrapper consistente
```

## Criterios de Aceptación

- ✅ **Todas las respuestas exitosas** usan wrapper `{ data: ... }`
- ✅ **Listas paginadas** incluyen metadatos `pagination`
- ✅ **Errores** mantienen formato sin wrapper (consistencia con estándares)
- ✅ **Respuestas vacías** retornan `null` (HTTP 204)
- ✅ **Type safety** completo en TypeScript
- ✅ **Interceptor automático** - sin configuración manual
- ✅ **Backward compatibility** en errores y paginación

## Conclusión

Este módulo implementa un formato **consistente y predecible** para todas las respuestas de la API, facilitando el desarrollo de clientes y garantizando una experiencia de desarrollador superior mediante:

- **Máxima consistencia**: `{ data: ... }` siempre
- **Zero configuration**: Funciona automáticamente
- **Type safety**: Tipado completo
- **Extensibilidad**: Fácil evolución futura

**¡Formato consistente, desarrollo más fácil!** 🎯
