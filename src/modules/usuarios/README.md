# Módulo 7: Gestión de Usuarios

## 📋 Descripción

Módulo fundamental que gestiona usuarios, perfiles y avatares. Base para autenticación y autorización.

## 🏗️ Arquitectura

### Entidades
- **Usuario**: Identidad core (email, password, estado)  
- **PerfilUsuario**: Información extendida y configuraciones

### Servicios
- **UsuariosService**: CRUD usuarios, estados, validaciones
- **AvatarService**: Gestión de archivos de avatar

### Repositories
- **UsuarioRepository**: Consultas optimizadas con filtros
- **PerfilUsuarioRepository**: Operaciones de perfil

## 🛠️ Funcionalidades

### Gestión de Usuarios
- ✅ Registro con validación de email único
- ✅ Estados: pendiente_verificacion → activo → inactivo/suspendido
- ✅ OAuth support (Google)
- ✅ Soft delete con restauración

### Perfiles
- ✅ Información personal (nombre, apellidos, teléfono, fecha nacimiento)
- ✅ Configuraciones personalizables
- ✅ Biografía y preferencias

### Avatares
- ✅ Subida con validación (JPG, PNG, WebP, máx 2MB)
- ✅ Almacenamiento local optimizado
- ✅ Eliminación automática de archivos anteriores

### Seguridad Básica
- ✅ Hash bcrypt para contraseñas
- ✅ Bloqueo por intentos fallidos
- ✅ Validación de fortaleza de contraseña

## 📡 APIs

### Públicos
- `POST /usuarios/registro` - Registrar usuario

### Autenticados  
- `GET /usuarios/perfil` - Obtener perfil
- `PUT /usuarios/perfil` - Actualizar perfil
- `POST /usuarios/avatar` - Subir avatar
- `PUT /usuarios/cambiar-password` - Cambiar contraseña

### Administrativos
- `GET /usuarios` - Listar con filtros y paginación
- `GET /usuarios/estadisticas` - Dashboard stats
- `PUT /usuarios/:id/estado` - Cambiar estado
- `DELETE /usuarios/:id` - Soft delete

## 🔧 Configuración

### Variables de Entorno
```bash
STORAGE_PATH=./uploads
API_BASE_URL=http://localhost:3001
BCRYPT_ROUNDS=12
```

### Dependencias
- **Módulo 1**: Configuración del Sistema
- **Módulo 2**: Base de Datos  
- **Módulo 5**: Logging

## 🧪 Testing

```bash
# Verificar módulo
npm run usuarios:verify

# Tests unitarios
npm test usuarios
```

## 📊 Estadísticas

El módulo incluye dashboard de estadísticas:
- Total usuarios por estado
- Registros último mes  
- Usuarios verificados
- Distribución por proveedor OAuth

## 🔗 Integración

### Para Módulo 8 (Autenticación)
```typescript
// Métodos disponibles
usuariosService.validarCredenciales(email, password)
usuariosService.actualizarUltimoLogin(id)
usuariosService.cambiarPasswordDirecto(id, hashedPassword)
```

### Para Otros Módulos
```typescript
// Importar
import { UsuariosService, Usuario } from '@/modules/usuarios'

// Inyectar
constructor(private usuariosService: UsuariosService)
```

## 📁 Estructura

```
src/modules/usuarios/
├── entities/           # Usuario, PerfilUsuario
├── services/          # UsuariosService, AvatarService  
├── controllers/       # UsuariosController
├── repositories/      # Custom repositories
├── dto/              # Request/Response DTOs
├── pipes/            # ValidacionAvatarPipe
├── constants/        # AVATAR_CONFIG, MENSAJES
└── interfaces/       # ConfiguracionUsuario
```

## ✅ Estado

- **Funcional**: CRUD completo sin duplicaciones
- **Preparado**: Para integración con Módulo 8
- **Limpio**: Sin código obsoleto o referencias a tokens
