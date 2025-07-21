# Módulo 7: Autenticación

## Descripción

Módulo completo de autenticación JWT con verificación de email, recuperación de contraseña, OAuth con Google, rate limiting, blacklist de tokens y auditoría automática.

## Características Principales

### ✅ Implementado

- **Registro de usuarios** con validación de contraseñas robustas
- **Login/Logout** con JWT access y refresh tokens
- **Verificación de email** obligatoria con tokens seguros
- **Recuperación de contraseña** via email con tokens de reset
- **OAuth con Google** (configuración opcional)
- **Rate limiting** para proteger contra ataques de fuerza bruta
- **Blacklist de tokens** en Redis para logout inmediato
- **Auditoría automática** de eventos críticos de seguridad
- **Guards reutilizables** para proteger endpoints
- **Renovación automática** de access tokens

### 🔄 Pendiente de Integración

- **Envío de emails** (requiere Módulo 12 - Comunicaciones)
- **Templates de email** personalizados
- **Dashboard de administración** de usuarios (Módulo 9)

## Endpoints Disponibles

### Autenticación Básica

- `POST /api/v1/auth/registro` - Registrar nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/refresh` - Renovar access token
- `GET /api/v1/auth/perfil` - Obtener perfil básico

### Verificación y Recuperación

- `GET /api/v1/auth/verificar-email/:token` - Verificar email
- `POST /api/v1/auth/reenviar-verificacion` - Reenviar verificación
- `POST /api/v1/auth/solicitar-reset` - Solicitar reset de contraseña
- `POST /api/v1/auth/reset-password` - Resetear contraseña

### OAuth

- `GET /api/v1/auth/google` - Iniciar OAuth con Google
- `GET /api/v1/auth/google/callback` - Callback de Google

## Uso Básico

### Proteger Endpoints

```typescript
@Controller('usuarios')
export class UsuarioController {
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async listarUsuarios() {
    // Endpoint protegido
  }

  @Get('publico')
  @Public() // Decorador para endpoints públicos (solo si se configura guard globalmente en main.ts)
  async endpointPublico() {
    // Endpoint público
  }
}
```

### Obtener Usuario Autenticado

```typescript
@Get('mi-perfil')
@UseGuards(JwtAuthGuard)
async obtenerMiPerfil(@GetUser() user: RequestUser) {
  return { id: user.id, email: user.email };
}

// Solo obtener ID
async method(@GetUser('id') userId: number) {
  // usar userId
}
```

### Rate Limiting Personalizado

```typescript
@Post('operacion-sensible')
@Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 por hora
async operacionSensible() {
  // Lógica protegida
}
```

## Configuración Requerida

### Variables de Entorno

```bash
# JWT (ya configuradas en Módulo 1)
JWT_SECRET=super-secret-key-32-characters-minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=refresh-secret-key-32-chars-min
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Google (nuevas - opcionales)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs (ya configuradas)
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001
```

### Configuración Google OAuth

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com/)
2. Habilitar Google+ API
3. Crear credenciales OAuth 2.0
4. Configurar URLs de redirección autorizadas:
   - `http://localhost:3001/api/v1/auth/google/callback` (desarrollo)
   - `https://tu-dominio.com/api/v1/auth/google/callback` (producción)

## Seguridad Implementada

### Protecciones Activas

- ✅ Contraseñas hasheadas con bcrypt (12 rounds)
- ✅ Rate limiting configurable por endpoint
- ✅ Blacklist inmediata de tokens en Redis
- ✅ Validación de tokens en cada request
- ✅ Tokens de verificación y reset de un solo uso
- ✅ Expiración automática de tokens
- ✅ Auditoría de eventos críticos
- ✅ Validación robusta de datos de entrada

### Rate Limiting Configurado

- **Login**: 5 intentos por 15 minutos por IP
- **Registro**: 3 registros por 15 minutos por IP
- **Reset contraseña**: 3 intentos por hora por email
- **Reenvío verificación**: 3 intentos por hora por email

## Arquitectura de Seguridad

### Flujo de Autenticación

```
1. Usuario se registra → Email de verificación
2. Usuario verifica email → Cuenta activada
3. Usuario hace login → Access + Refresh tokens
4. Cliente usa Access token → Validación en cada request
5. Access token expira → Cliente renueva con Refresh token
6. Usuario hace logout → Tokens invalidados inmediatamente
```

### Blacklist de Tokens

- **Storage**: Redis para acceso rápido
- **TTL**: Mismo tiempo restante del token
- **Verificación**: En cada request autenticado
- **Limpieza**: Automática por expiración Redis

## Integración con Otros Módulos

### Dependencias Activas

- **Módulo 1**: Configuración (JWT secrets, URLs)
- **Módulo 2**: Base de datos (entidades)
- **Módulo 3**: Redis (blacklist, rate limiting)
- **Módulo 4**: Respuestas (excepciones)
- **Módulo 5**: Logging (eventos técnicos)
- **Módulo 6**: Auditoría (eventos críticos)

### Pendientes de Integración

- **Módulo 12**: Comunicaciones (emails)
- **Módulo 9**: Gestión de usuarios (CRUD completo)

## Base de Datos

### Tablas Creadas

```sql
-- usuarios (básica para autenticación)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nombre VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'pendiente_verificacion',
  email_verificado_en TIMESTAMP,
  google_id VARCHAR(255),
  refresh_token TEXT,
  ultimo_login TIMESTAMP,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_modificacion TIMESTAMP DEFAULT NOW(),
  fecha_eliminacion TIMESTAMP,
  usuario_creacion VARCHAR(255),
  usuario_modificacion VARCHAR(255),
  usuario_eliminacion VARCHAR(255)
);

-- tokens_verificacion
CREATE TABLE tokens_verificacion (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'verificacion_email', 'reset_password'
  expira_en TIMESTAMP NOT NULL,
  usado BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);
```

### Índices Recomendados

```sql
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX idx_usuarios_refresh_token ON usuarios(refresh_token);
CREATE INDEX idx_tokens_token ON tokens_verificacion(token);
CREATE INDEX idx_tokens_email_tipo ON tokens_verificacion(email, tipo);
CREATE INDEX idx_tokens_expira_usado ON tokens_verificacion(expira_en, usado);
```

## Testing

### Comandos de Testing

```bash
# Tests unitarios
npm run test auth

# Tests de integración
npm run test:e2e auth

# Coverage
npm run test:cov auth
```

### Casos de Prueba Implementados

- ✅ Registro con validaciones
- ✅ Login con credenciales válidas/inválidas
- ✅ Verificación de email
- ✅ Reset de contraseña completo
- ✅ Renovación de tokens
- ✅ Rate limiting
- ✅ Blacklist de tokens
- ✅ OAuth con Google

## Monitoreo y Logs

### Eventos Loggeados

- Registro de usuarios
- Login exitoso/fallido
- Logout
- Verificación de email
- Reset de contraseña
- Errores de autenticación
- Rate limiting activado

### Eventos Auditados

- Login de usuarios
- Logout de usuarios
- Reset de contraseña
- Cambios críticos de seguridad

## Próximos Pasos

### Inmediatos

1. **Integrar con Módulo 12** para envío real de emails
2. **Crear migraciones** para las tablas
3. **Configurar Google OAuth** en producción

### Futuros (Módulo 9)

1. **Expandir gestión de usuarios** (CRUD, roles)
2. **Dashboard administrativo**
3. **Gestión de sesiones activas**
4. **Configuración de políticas de contraseña**

## Notas de Implementación

### Decisiones Técnicas

- **bcrypt**: 12 rounds para balance seguridad/performance
- **JWT**: 15 minutos access, 7 días refresh
- **Redis**: Para blacklist y rate limiting rápido
- **Passport**: Estrategias estándar de la industria
- **class-validator**: Validaciones robustas de entrada

### Consideraciones de Producción

- Configurar HTTPS obligatorio
- Usar Redis cluster para alta disponibilidad
- Monitorear métricas de autenticación
- Configurar alertas de seguridad
- Revisar logs de rate limiting

---

**Estado**: ✅ Implementado y listo para uso
**Próxima integración**: Módulo 12 (Comunicaciones) para emails
