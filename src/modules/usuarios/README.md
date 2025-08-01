# Módulo 7: Gestión de Usuarios

## Descripción

Módulo core para gestión de usuarios con **arquitectura limpia**, **responsabilidades unificadas** y **flujo de datos optimizado**.

## Arquitectura Refactorizada

### 📁 Estructura Optimizada

```
src/modules/usuarios/
├── entities/             # 🏗️ Modelos de dominio (Usuario, PerfilUsuario)
├── repositories/         # 💾 Acceso a datos puro (queries optimizadas)
├── services/            # 🧠 Lógica de negocio unificada
│   ├── usuarios.service.ts    # ✅ Servicio PRINCIPAL (todo centralizado)
│   └── avatar.service.ts      # ✅ Servicio auxiliar (archivos físicos)
├── controllers/         # 🌐 Endpoint HTTP unificado
│   └── usuarios.controller.ts # ✅ Controller ÚNICO consolidado
├── dto/                 # 📋 DTOs con class-transformer
│   ├── request/              # DTOs de entrada
│   └── response/             # DTOs tipados con @Expose()
├── interfaces/          # 📝 Tipos de dominio específicos
├── pipes/               # 🔍 Validaciones de archivos
└── constants/           # ⚙️ Configuraciones del módulo
```

### 🎯 **MEJORAS PRINCIPALES**

#### **1. Servicio Unificado (UsuariosService)**

```typescript
// ✅ ANTES: 3 servicios separados creando confusión
// ❌ UsuariosService + PerfilesService + AvatarService

// ✅ AHORA: 1 servicio principal que maneja todo
@Injectable()
export class UsuariosService {
  // Maneja: usuarios + perfiles + autenticación + verificación
  // Coordina: transacciones, validaciones, logging
  // Delega: solo archivos físicos a AvatarService
}
```

#### **2. Controller Consolidado (UsuariosController)**

```typescript
// ✅ ANTES: 3 controllers separados
// ❌ UsuariosPublicosController + PerfilesController + UsuariosAdminController

// ✅ AHORA: 1 controller organizado por responsabilidad
@Controller('api/v1/usuarios')
export class UsuariosController {
  // Secciones: Públicos → Autenticados → Admin
  // Response: class-transformer automático
  // Inyección: Solo UsuariosService principal
}
```

#### **3. DTOs Response Automáticos**

```typescript
// ✅ ANTES: Mapeo manual en cada endpoint
// ❌ private mapearUsuarioResponse(usuario: any) { ... }

// ✅ AHORA: class-transformer automático
export class UsuarioResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  // Automático con plainToInstance()
}
```

## Flujo de Datos Optimizado

### 🔄 Arquitectura Final

```
HTTP Request
     ↓
UsuariosController (único)
     ↓
UsuariosService (principal) ←→ AvatarService (auxiliar)
     ↓
UsuarioRepository + PerfilRepository
     ↓
PostgreSQL (con transacciones)
```

### ✅ Responsabilidades Claras

#### **UsuariosController** (Capa HTTP)

- ✅ **Un solo punto de entrada** para todas las operaciones
- ✅ **Organizado por tipo**: público → autenticado → admin
- ✅ **DTOs automáticos**: class-transformer sin mapeo manual
- ✅ **Inyección mínima**: Solo UsuariosService + AvatarService auxiliar

#### **UsuariosService** (Lógica de Negocio Principal)

- ✅ **Centraliza TODA la lógica**: usuarios, perfiles, verificación
- ✅ **Maneja transacciones**: operaciones atómicas con DataSource
- ✅ **Validaciones de dominio**: reglas de negocio centralizadas
- ✅ **Coordina repositories**: sin exponer lógica de datos

#### **Repositories** (Acceso a Datos Puro)

- ✅ **Queries optimizadas**: con QueryBuilder y filtros eficientes
- ✅ **Sin lógica de negocio**: solo acceso y transformación de datos
- ✅ **Soporte transaccional**: EntityManager opcional
- ✅ **Métodos específicos**: buscarPorEmailActivo, buscarConFiltros

## APIs Consolidadas

### 🌍 **Endpoints Públicos**

```http
POST /api/v1/usuarios/registro           # Registro + creación perfil automática
POST /api/v1/usuarios/verificar-email    # Verificación con transición de estado
```

### 👤 **Endpoints Autenticados** (perfil del usuario)

```http
GET    /api/v1/usuarios/perfil           # Usuario completo con perfil
PUT    /api/v1/usuarios/perfil           # Update perfil en transacción
POST   /api/v1/usuarios/avatar           # Upload + update + cleanup anterior
DELETE /api/v1/usuarios/avatar           # Delete + cleanup archivo
PUT    /api/v1/usuarios/cambiar-password # Cambio seguro con validaciones
```

### 🛡️ **Endpoints Administrativos** (gestión completa)

```http
GET    /api/v1/usuarios                  # Lista paginada con filtros avanzados
GET    /api/v1/usuarios/estadisticas     # Stats agregadas optimizadas
GET    /api/v1/usuarios/:id              # Usuario específico + auditoría
PUT    /api/v1/usuarios/:id/estado       # Cambios de estado validados
DELETE /api/v1/usuarios/:id              # Soft delete con auditoría
POST   /api/v1/usuarios/:id/restaurar    # Restaurar con validaciones
```

## Características Implementadas

### ✅ **Funcionalidades Core**

- **CRUD Unificado** con transacciones automáticas
- **Estados de usuario** con transiciones validadas
- **Perfiles integrados** sin servicios separados
- **Sistema de avatares** con cleanup automático
- **Soft delete** con restauración completa
- **Búsqueda optimizada** con QueryBuilder avanzado
- **Auditoría automática** en todas las operaciones

### 🔐 **Preparado para Autenticación**

- **Campos JWT** completamente implementados
- **Tokens seguros** con generación UUID
- **Intentos de login** con bloqueo automático
- **Métodos de validación** listos para Módulo 8

### 🎯 **Optimizaciones de Performance**

- **Transacciones** para operaciones complejas
- **Queries optimizadas** con índices apropiados
- **Lazy loading** con relations opcionales
- **Caching** preparado para Redis (Módulo 3)

## Integración con Infraestructura

### 📦 **Reutilización Completa**

```typescript
// Módulo 4 - Respuestas Estandarizadas
return this.success(plainToInstance(UsuarioResponseDto, usuario));

// Módulo 5 - Logging Estructurado
this.logger.log(`Usuario creado: ${usuario.id}`, 'UsuariosService');

// Módulo 2 - Base Entity con Auditoría
export class Usuario extends BaseEntity { ... }

// Módulo 1 - Configuración Centralizada
const config = this.configuracionService.uploads;
```

### 🔗 **Dependencias Optimizadas**

```
✅ Módulo 1 (Configuración) → Variables uploads, JWT secrets
✅ Módulo 2 (Base de Datos)  → TypeORM, BaseEntity, transacciones
✅ Módulo 4 (Respuestas)     → class-transformer, @UsePagination()
✅ Módulo 5 (Logging)        → LoggerService estructurado
```

### ⏳ **Listo Para Integración**

```
→ Módulo 8 (Autenticación) → Guards, estrategias JWT
→ Módulo 9 (Autorización)  → RBAC, políticas Casbin
→ Módulo 12 (Comunicaciones) → Emails de verificación
```

## Ejemplo de Implementación

### **Service Principal (Lógica Unificada)**

```typescript
@Injectable()
export class UsuariosService {
  async crear(datos: CrearUsuarioDto): Promise<Usuario> {
    return this.dataSource.transaction(async (manager) => {
      // Validar email único
      const existe = await this.usuarioRepository.existeEmail(datos.email);
      if (existe) throw new ConflictException('Email ya existe');

      // Crear usuario
      const usuario = await this.usuarioRepository.crear(
        {
          email: datos.email.toLowerCase(),
          password: await this.hashearPassword(datos.password),
          // ...
        },
        manager,
      );

      // Crear perfil automáticamente
      await this.perfilRepository.crear({ usuarioId: usuario.id }, manager);

      return usuario;
    });
  }
}
```

### **Controller Unificado (Un Solo Punto)**

```typescript
@Controller('api/v1/usuarios')
export class UsuariosController extends BaseController {
  constructor(
    private readonly usuariosService: UsuariosService, // ✅ Solo servicio principal
    private readonly avatarService: AvatarService, // ✅ Solo para archivos
  ) {}

  @Post('registro')
  async registrar(@Body() datos: CrearUsuarioDto) {
    const usuario = await this.usuariosService.crear(datos);

    // ✅ class-transformer automático
    return this.created(
      plainToInstance(UsuarioResponseDto, usuario),
      'Usuario registrado exitosamente',
    );
  }
}
```

### **Repository Limpio (Solo Datos)**

```typescript
@Injectable()
export class UsuarioRepository {
  async buscarConFiltros(
    filtros: FiltrosUsuarioDto,
  ): Promise<[Usuario[], number]> {
    const query = this.repository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.perfil', 'perfil')
      .where('usuario.fechaEliminacion IS NULL');

    // Aplicar filtros dinámicamente
    if (filtros.busqueda) {
      query.andWhere(
        '(usuario.nombre ILIKE :busqueda OR usuario.email ILIKE :busqueda)',
      );
    }

    return query.getManyAndCount();
  }
}
```

## Testing Estratificado

```bash
# Tests por capa específica
npm run test usuarios.service.spec     # Lógica de negocio con mocks
npm run test usuario.repository.spec   # Queries con base de datos test
npm run test usuarios.controller.spec  # HTTP con supertest

# Tests de integración completa
npm run test:e2e usuarios              # Flujo end-to-end real
```

## Estado Final

✅ **Arquitectura limpia consolidada**  
✅ **Responsabilidades unificadas y claras**  
✅ **Performance optimizada con transacciones**  
✅ **DTOs automáticos con class-transformer**  
✅ **Testing completo por capas**  
✅ **Integración total con infraestructura**  
⏳ **Guards de auth/authz pendientes** (Módulos 8 y 9)

**La implementación final representa las mejores prácticas de NestJS con arquitectura enterprise-grade, lista para producción y escalabilidad.**
