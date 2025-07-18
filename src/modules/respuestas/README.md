# Módulo 4: Respuestas Estandarizadas

## **Formato Consistente con Wrapper { data: ... }**

## 📋 Descripción

Módulo que implementa un formato consistente para todas las respuestas HTTP usando wrapper `{ data: ... }` para máxima predictibilidad y uniformidad en la API. **Auto-configurado globalmente** sin necesidad de setup adicional.

## ✨ Características

- ✅ **Formato Consistente**: Todas las respuestas exitosas usan `{ data: ... }`
- ✅ **Paginación Automática**: Decorador `@UsePagination()` para listas con metadatos
- ✅ **Manejo de Errores Unificado**: Un solo filtro que captura todas las excepciones
- ✅ **Integración class-validator**: Conversión automática de errores de validación
- ✅ **Configuración Cero**: Funciona inmediatamente sin setup adicional
- ✅ **Factory Methods**: Excepciones con métodos de creación intuitivos
- ✅ **Type Safety**: Tipado completo con TypeScript
- ✅ **Global**: Se aplica automáticamente a toda la aplicación

## 🚀 Instalación y Uso

### 1. Ya está Configurado Globalmente

```typescript
// app.module.ts - YA CONFIGURADO ✅
@Module({
  imports: [
    ConfiguracionModule,
    DatabaseModule,
    RedisModule,
    ResponseModule, // ← Ya importado y funcionando
  ],
})
export class AppModule {}
```

**¡No necesitas configurar nada más!** El módulo se aplica automáticamente a todos los controladores.

### 2. Uso en Controladores

#### 🔹 Respuesta de Entidad Única

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

#### 🔹 Lista Simple

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

#### 🔹 Lista Paginada

```typescript
import { UsePagination } from '@/modules/respuestas';

@Get()
@UsePagination() // ← Decorador mágico
async listarUsuariosPaginados(@Query() params: any) {
  // El servicio debe retornar: { data: T[], total: number } o [data: T[], total: number]
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

#### 🔹 Respuesta Vacía (DELETE)

```typescript
@Delete(':id')
async eliminarUsuario(@Param('id') id: number) {
  await this.usuarioService.eliminar(id);
  return; // HTTP 204 No Content automático
}
```

### 3. Manejo de Errores

#### 🔸 Errores de Validación (Automático)

```typescript
// DTO con class-validator
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

#### 🔸 Errores de Negocio

```typescript
import { BusinessException } from '@/modules/respuestas';

// En servicios
if (!usuario) {
  throw BusinessException.notFound('Usuario', id);
}

if (await this.existeEmail(email)) {
  throw BusinessException.alreadyExists('Usuario', 'email', email);
}

// Factory methods disponibles:
BusinessException.notFound(resource, id);
BusinessException.alreadyExists(resource, field, value);
BusinessException.operationNotAllowed(operation, reason);
BusinessException.insufficientFunds(current, required);
BusinessException.invalidState(current, allowed, resource);
BusinessException.conflict(resource, reason);
BusinessException.businessRuleViolation(rule, message, details);
```

## 🛠️ Utilidades de Paginación

### En Servicios

```typescript
import { PaginationUtils } from '@/modules/respuestas';

@Injectable()
export class UsuarioService {
  async listarPaginado(queryParams: any) {
    // Extraer parámetros de paginación de query string
    const paginationParams = PaginationUtils.fromQuery(queryParams);

    // Configurar TypeORM con offset/limit
    const typeormConfig = PaginationUtils.toTypeOrmConfig(paginationParams);

    // Consultar datos y total
    const [data, total] = await Promise.all([
      this.usuarioRepository.find({
        ...typeormConfig,
        where: {
          /* filtros */
        },
        select: {
          /* campos */
        },
      }),
      this.usuarioRepository.count({
        where: {
          /* mismos filtros */
        },
      }),
    ]);

    // Retornar en formato esperado por @UsePagination()
    return { data, total };
  }
}
```

### Métodos Disponibles en PaginationUtils

```typescript
// Extraer parámetros de query string
fromQuery(query: Record<string, any>): PaginationParams

// Convertir a configuración TypeORM
toTypeOrmConfig(params: PaginationParams): { skip: number; take: number }

// Calcular metadatos de paginación
calculateMeta(total: number, params: PaginationParams): PaginationMeta
```

## 📝 Tipos TypeScript

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

// Parámetros de paginación
interface PaginationParams {
  page: number; // Página actual (base 1)
  limit: number; // Elementos por página (máx 100)
  offset: number; // Calculado: (page - 1) * limit
}

// Resultado de servicio para @UsePagination()
interface PaginatedResult<T> {
  data: T[];
  total: number;
}

// Error estándar
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

## 💡 Ventajas del Formato Consistente

### Para Desarrolladores

- **Parsing Uniforme**: Siempre `response.data` en clientes
- **Predictibilidad**: No hay que adivinar la estructura
- **Type Safety**: Un solo tipo de respuesta para manejar
- **Extensibilidad**: Fácil agregar metadata global

### Para APIs

- **Consistencia Total**: Mismo formato para todas las respuestas exitosas
- **Mantenibilidad**: Una sola lógica de parsing en cliente
- **Escalabilidad**: Fácil evolución sin breaking changes
- **Standards**: Muchas APIs empresariales usan este patrón (GitHub, Stripe, etc.)

### Para Clientes Frontend

```javascript
// JavaScript/TypeScript - Parsing uniforme
const response = await fetch('/api/usuarios/1');
const json = await response.json();
const user = json.data; // ✅ Siempre aquí

// Para listas
const listResponse = await fetch('/api/usuarios');
const listJson = await listResponse.json();
const users = listJson.data; // ✅ Siempre aquí

// Para paginadas
const pagedResponse = await fetch('/api/usuarios?page=1&limit=10');
const pagedJson = await pagedResponse.json();
const users = pagedJson.data; // ✅ Datos
const pagination = pagedJson.pagination; // ✅ Metadatos
```

## 📄 Ejemplos de Respuestas

### ✅ Éxito - Entidad Única

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

### ✅ Éxito - Lista Simple

```json
{
  "data": [
    { "id": 1, "nombre": "Usuario 1" },
    { "id": 2, "nombre": "Usuario 2" }
  ]
}
```

### ✅ Éxito - Lista Paginada

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

### ❌ Error - Validación

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

### ❌ Error - Negocio

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Usuario con ID '123' no fue encontrado",
    "details": {
      "resource": "Usuario",
      "id": 123
    }
  }
}
```

## 🔄 Comparación con Formato Anterior

### **ANTES (Datos Directos):**

```json
// ❌ Inconsistente - diferentes estructuras
{ "id": 1, "nombre": "Juan" }                    // Entidad
[{ "id": 1 }, { "id": 2 }]                       // Lista
{ "data": [...], "pagination": {...} }           // Paginada
```

### **AHORA (Wrapper Consistente):**

```json
// ✅ Consistente - siempre mismo patrón
{ "data": { "id": 1, "nombre": "Juan" } }        // Entidad
{ "data": [{ "id": 1 }, { "id": 2 }] }           // Lista
{ "data": [...], "pagination": {...} }           // Paginada
```

## 🧪 Testing

### Ejecutar Pruebas

```bash
# Pruebas unitarias del módulo
npm test -- respuestas

# Iniciar servidor para pruebas manuales
npm run start:dev

# Ver documentación interactiva
# http://localhost:3001/api/docs
```

### Validar Respuestas en Endpoints Existentes

```bash
# Health check - debe tener wrapper { data: ... }
curl http://localhost:3001/sistema/health | jq '.data'

# Configuración - debe tener wrapper { data: ... }
curl -H "Authorization: Bearer TOKEN" http://localhost:3001/sistema/configuracion | jq '.data'

# Validar error
curl -X POST http://localhost:3001/test-endpoint | jq '.error'
```

## 📋 Códigos de Error Disponibles

### Validación

- `VALIDATION_ERROR` - Error general de validación
- `REQUIRED_FIELD` - Campo requerido
- `INVALID_FORMAT` - Formato inválido
- `INVALID_EMAIL` - Email inválido
- `MIN_LENGTH` / `MAX_LENGTH` - Longitud inválida
- `INVALID_VALUE` - Valor inválido

### Autenticación/Autorización

- `UNAUTHORIZED` - No autenticado
- `FORBIDDEN` - Sin permisos
- `TOKEN_EXPIRED` - Token expirado
- `INVALID_CREDENTIALS` - Credenciales inválidas

### Recursos

- `NOT_FOUND` - Recurso no encontrado
- `ALREADY_EXISTS` - Recurso ya existe
- `CONFLICT` - Conflicto de recursos

### Sistema

- `INTERNAL_ERROR` - Error interno
- `DATABASE_ERROR` - Error de base de datos
- `SERVICE_UNAVAILABLE` - Servicio no disponible
- `RATE_LIMIT_EXCEEDED` - Límite de requests excedido

### Negocio

- `BUSINESS_RULE_VIOLATION` - Regla de negocio violada
- `OPERATION_NOT_ALLOWED` - Operación no permitida
- `INVALID_OPERATION_STATE` - Estado inválido para operación

## 🏗️ Arquitectura Interna

### Componentes Principales

```
ResponseModule
├── ResponseInterceptor    # Aplica wrapper { data: ... } automáticamente
├── ErrorFilter           # Captura todas las excepciones
├── ValidationException   # Errores de validación con factory methods
├── BusinessException     # Errores de negocio con factory methods
├── PaginationUtils       # Utilidades para paginación
└── @UsePagination()      # Decorador para endpoints paginados
```

### Flujo de Ejecución

```
Request → Controller → Service → Response
                           ↓
                    ResponseInterceptor
                           ↓
                    { data: ... } wrapper
                           ↓
                      JSON Response
```

## 🚧 Migración desde Formato Anterior

Si migras desde el formato "datos directos", solo necesitas actualizar el parsing en clientes:

```javascript
// ANTES
const user = response; // Datos directos
const users = response; // Array directo
const errors = response; // Error directo

// AHORA
const user = response.data; // ✅ Wrapper consistente
const users = response.data; // ✅ Wrapper consistente
const errors = response.error; // ❌ Errores sin wrapper (estándar)
```

## ✅ Criterios de Aceptación

- ✅ **Todas las respuestas exitosas** usan wrapper `{ data: ... }`
- ✅ **Listas paginadas** incluyen metadatos `pagination`
- ✅ **Errores** mantienen formato sin wrapper (consistencia con estándares HTTP)
- ✅ **Respuestas vacías** retornan `null` (HTTP 204)
- ✅ **Type safety** completo en TypeScript
- ✅ **Interceptor automático** sin configuración manual
- ✅ **Integración class-validator** automática
- ✅ **Factory methods** para excepciones comunes
- ✅ **Logging contextual** para debugging

## 🎯 Casos de Uso Verificados

### ✅ Módulo 1 (Configuración)

```typescript
// src/modules/configuracion/controllers/sistema.controller.ts
import { BusinessException } from '../../respuestas';

async validarConfiguracion() {
  if (!resultado.valida) {
    throw BusinessException.businessRuleViolation(
      'CONFIGURACION_INVALIDA',
      'La configuración del sistema contiene errores',
      { errores: resultado.errores }
    );
  }
  return resultado; // Se convierte a { data: resultado }
}
```

## 🏆 Conclusión

Este módulo implementa un formato **consistente y predecible** para todas las respuestas de la API, facilitando el desarrollo de clientes y garantizando una experiencia de desarrollador superior mediante:

- **✨ Máxima consistencia**: `{ data: ... }` siempre para respuestas exitosas
- **⚡ Zero configuration**: Funciona automáticamente sin setup
- **🔒 Type safety**: Tipado completo con TypeScript
- **🚀 Extensibilidad**: Fácil evolución futura sin breaking changes
- **📚 Estándares**: Sigue patrones de APIs empresariales reconocidas

**¡Formato consistente, desarrollo más fácil!** 🎯

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias:

1. **Revisa la documentación** de tipos TypeScript en `/interfaces/interfaces.ts`
2. **Verifica los ejemplos** en los controladores existentes
3. **Consulta los códigos de error** en `/constants/error-codes.ts`
4. **Usa las factory methods** de `BusinessException` para casos comunes

El módulo está **completamente testeado** y en **producción activa** en el Módulo 1 (Configuración).
