# Módulo 9: Autorización con Casbin

Sistema RBAC automático con Casbin que verifica permisos sin configuración manual por endpoint.

## Arquitectura

Sigue el patrón de capas estándar del proyecto:

```
Controllers (API) → Services (Lógica) → Repositories (Datos) → Entities (BD)
```

**Entidades**: `Rol`, `UsuarioRol`, `CasbinRule`
**Guard Global**: `CasbinGuard` se aplica automáticamente a todos los endpoints

## Características

- **Autorización Automática**: Sin decoradores manuales
- **keyMatch2 + regexMatch**: Rutas RESTful y wildcards `/api/v1/*`
- **Cache Redis**: 300s TTL con invalidación automática
- **Arquitectura Limpia**: Controller → Service → Repository

## Instalación

```bash
# Dependencia única
npm install casbin

# Migraciones automáticas
npm run migration:generate -- CreateAutorizacionTables
npm run migration:run

# Seeds iniciales
npm run seed
```

## Configuración

```bash
# .env
DB_SCHEMA_AUTORIZACION=autorizacion
CASBIN_MODEL_PATH=./src/modules/autorizacion/config/rbac_model.conf
CASBIN_CACHE_TTL=300
```

## Uso Automático

Los permisos se verifican sin configuración:

```typescript
@Controller('api/v1/usuarios')
export class UsuariosController {
  @Get(':id') // ← CasbinGuard verifica automáticamente
  async obtener(@Param('id') id: string) {
    return this.service.obtener(id);
  }
}
```

## API Endpoints

### Gestión de Roles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/autorizacion/roles` | Crear rol |
| GET | `/api/v1/autorizacion/roles` | Listar roles (paginado) |
| GET | `/api/v1/autorizacion/roles/:id` | Obtener rol |
| PUT | `/api/v1/autorizacion/roles/:id` | Actualizar rol |
| DELETE | `/api/v1/autorizacion/roles/:id` | Eliminar rol |
| POST | `/api/v1/autorizacion/roles/asignar` | Asignar rol a usuario |
| DELETE | `/api/v1/autorizacion/roles/usuario/:usuarioId/rol/:rolCodigo` | Remover rol |
| GET | `/api/v1/autorizacion/roles/usuario/:usuarioId` | Roles de usuario |

### Gestión de Políticas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/v1/autorizacion/politicas` | Crear política |
| GET | `/api/v1/autorizacion/politicas` | Listar todas |
| GET | `/api/v1/autorizacion/politicas/rol/:rol` | Políticas de rol |
| POST | `/api/v1/autorizacion/politicas/eliminar` | Eliminar política |
| POST | `/api/v1/autorizacion/politicas/verificar` | Verificar permisos |

## Ejemplos de Uso

### Crear Rol

```typescript
POST /api/v1/autorizacion/roles
{
  "codigo": "EDITOR",
  "nombre": "Editor de Contenido",
  "descripcion": "Puede editar documentos"
}
```

### Asignar Rol

```typescript
POST /api/v1/autorizacion/roles/asignar
{
  "usuarioId": "123",
  "rolCodigo": "EDITOR",
  "fechaExpiracion": "2024-12-31T23:59:59Z" // Opcional
}
```

### Crear Políticas

```typescript
// keyMatch2 (rutas RESTful)
POST /api/v1/autorizacion/politicas
{
  "rol": "EDITOR",
  "ruta": "/api/v1/documentos/:id",
  "accion": "PUT"
}

// regexMatch (wildcards)
POST /api/v1/autorizacion/politicas
{
  "rol": "ADMINISTRADOR", 
  "ruta": "/api/v1/*",
  "accion": "GET"
}
```

### Eliminar Política

```typescript
POST /api/v1/autorizacion/politicas/eliminar
{
  "rol": "EDITOR",
  "ruta": "/api/v1/documentos/:id", 
  "accion": "DELETE"
}
```

## Roles del Sistema

### ADMINISTRADOR
- **Acceso**: Completo (`/api/v1/*` GET + operaciones específicas)
- **Sistema**: No eliminable
- **Políticas**: Wildcard + CRUD completo

### USUARIO  
- **Acceso**: Recursos propios y básicos
- **Políticas**: GET/PUT en `/api/v1/usuarios/:id`

### INVITADO
- **Acceso**: Solo lectura limitada  
- **Políticas**: GET básico

## Modelo Casbin

```ini
[request_definition]
r = sub, obj, act

[policy_definition] 
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && (keyMatch2(r.obj, p.obj) || regexMatch(r.obj, p.obj)) && r.act == p.act
```

## Base de Datos

**Tablas**:
- `roles`: Definición de roles
- `usuario_roles`: Asignaciones usuario-rol
- `casbin_rule`: Políticas de Casbin

**Migraciones**: TypeORM automáticas
**Seeds**: Roles básicos + políticas iniciales

## Flujo de Verificación

```
Request → CasbinGuard → Extraer(recurso, acción) 
        → Cache Redis → CasbinService.enforce() 
        → Permitir/Denegar
```

## Troubleshooting

**Access Denied**: Verificar roles asignados y políticas existentes
**Políticas no funcionan**: Revisar sintaxis del matcher en `rbac_model.conf`
**Performance**: Cache Redis (300s TTL) optimiza verificaciones

El sistema proporciona autorización completa sin configuración manual, siguiendo patrones estándar del proyecto.
