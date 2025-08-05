# Módulo 8: Autenticación

## 🎯 **Descripción**

Sistema completo de autenticación JWT que incluye **registro de usuarios, verificación de email, login/logout, recuperación de contraseña y OAuth Google**. Integra auditoría automática y manejo de tokens seguros con blacklist en Redis.

## 🔐 **Características Principales**

### **Registro y Verificación**

- ✅ Registro de usuarios con validación
- ✅ Verificación de email con tokens seguros
- ✅ Estados de usuario (pendiente → activo)

### **Autenticación JWT**

- ✅ Access tokens (15min) y refresh tokens (7d)
- ✅ Blacklist dual en Redis (individual + por usuario)
- ✅ Renovación automática de tokens

### **Seguridad Avanzada**

- ✅ Rate limiting por endpoint
- ✅ Protección contra fuerza bruta
- ✅ Auditoría automática con `@Auditable()`
- ✅ Tracking de dispositivos (IP, User-Agent)

### **Recuperación de Contraseña**

- ✅ Tokens temporales seguros (1 hora)
- ✅ Invalidación de todas las sesiones tras cambio

### **OAuth Google**

- ✅ Integración completa con Google OAuth 2.0
- ✅ Creación automática de usuarios

## 📍 **API Endpoints**

### **Registro y Verificación**

```http
POST /api/v1/auth/registro
POST /api/v1/auth/verificar-email
```

### **Autenticación Principal**

```http
POST /api/v1/auth/login
POST /api/v1/auth/renovar-token
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
```

### **Recuperación de Contraseña**

```http
POST /api/v1/auth/recuperar-password
POST /api/v1/auth/confirmar-password
```

### **OAuth Google**

```http
GET /api/v1/auth/google
GET /api/v1/auth/google/callback
```

## 🛡️ **Sistema de Seguridad**

### **Rate Limiting**

```typescript
@Post('registro')
@Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 por hora

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 por minuto

@Post('recuperar-password')
@Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 por hora
```

### **Auditoría Automática**

```typescript
@Post('login')
@Auditable({ tabla: 'usuarios', descripcion: 'Login con credenciales' })

@Post('logout-all')
@AuditableCritical({ tabla: 'usuarios', descripcion: 'Cierre todas sesiones' })

@Post('recuperar-password')
@AuditableCritical({ tabla: 'usuarios', descripcion: 'Solicitud recuperación' })
```

## 🏗️ **Arquitectura de Tokens**

### **Doble Sistema Integrado**

#### **JWT Tokens (JwtTokenService)**

- Access tokens para autenticación activa
- Blacklist en Redis con doble indexación:
  ```
  blacklist:token_hash → "1" (verificación rápida)
  user_tokens:userId:token_hash → "1" (invalidación masiva)
  ```

#### **TokenUsuario Entity (TokenService)**

- Refresh tokens persistentes en PostgreSQL
- Tokens de verificación y recuperación
- Tracking completo de dispositivos

### **Flujos Sincronizados**

```typescript
// Login: PostgreSQL + JWT
await tokenService.crearToken(userId, TipoToken.REFRESH, refreshToken);
const { accessToken } = jwtTokenService.generarTokens(userId, email);

// Renovar: Validación dual
const tokenEntity = await tokenService.validarToken(
  refreshToken,
  TipoToken.REFRESH,
);
const validation = await jwtTokenService.validarToken(refreshToken, 'refresh');

// Logout: Blacklist Redis + Revocación PostgreSQL
await jwtTokenService.agregarABlacklist(accessToken);
await tokenService.revocarToken(tokenEntity.id);
```

## 🔧 **Servicios Principales**

### **AuthService**

```typescript
// Registro y verificación
async registrarUsuario(datos: CrearUsuarioDto, requestInfo?: RequestInfoData)
async verificarEmail(datos: VerificarEmailDto): Promise<void>

// Autenticación
async login(datos: LoginDto, requestInfo?: RequestInfoData): Promise<AuthResponse>
async logout(accessToken: string, refreshToken?: string, userId?: string)
async logoutAll(userId: string): Promise<void>

// Recuperación
async solicitarRecuperacionPassword(datos: RecuperarPasswordDto, requestInfo?: RequestInfoData)
async confirmarNuevaPassword(datos: ConfirmarPasswordDto): Promise<void>
```

### **JwtTokenService**

```typescript
// Generación y validación
generarTokens(userId: string, email: string): TokenPair
async validarToken(token: string, type: 'access' | 'refresh'): Promise<TokenValidationResult>
async renovarAccessToken(refreshToken: string): Promise<NewAccessToken>

// Blacklist management
async agregarABlacklist(token: string): Promise<void>
async estaEnBlacklist(token: string): Promise<boolean>
async invalidarTodosLosTokens(userId: string): Promise<void>
```

### **TokenService**

```typescript
// Gestión en base de datos
async crearToken(userId: string, tipo: TipoToken, token: string, ttl: number, userAgent?: string, ip?: string)
async validarToken(token: string, tipo: TipoToken): Promise<TokenUsuario | null>
async revocarToken(tokenId: string): Promise<void>
async revocarTodosPorUsuario(userId: string, tipo: TipoToken): Promise<void>
```

## 🔐 **Uso del JwtAuthGuard**

### **Controller Protegido**

```typescript
import { JwtAuthGuard } from '../autenticacion/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController extends BaseController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser) {
    const userId = this.getUser(req); // Helper del BaseController
    const user = await this.userService.findById(userId);
    return this.success(user);
  }
}
```

### **Estrategia JWT**

```typescript
// Validación automática en JwtStrategy
async validate(request: any, payload: JwtPayload): Promise<Usuario> {
  // 1. Verificar blacklist Redis
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  const estaEnBlacklist = await this.jwtTokenService.estaEnBlacklist(token);

  // 2. Validar usuario activo
  const usuario = await this.authService.validarUsuarioPorId(payload.sub);

  return usuario; // Se agrega automáticamente a req.user
}
```

## 📊 **Entidad TokenUsuario**

```typescript
@Entity('tokens_usuario')
export class TokenUsuario {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  usuarioId: string;

  @Column({ type: 'enum', enum: TipoToken })
  tipo: TipoToken; // 'refresh' | 'verificacion_email' | 'recuperacion_password'

  @Column()
  token: string;

  @Column()
  fechaExpiracion: Date;

  @Column({ nullable: true })
  infoDispositivo?: string; // User-Agent

  @Column({ type: 'inet', nullable: true })
  direccionIp?: string;

  @Column({ default: false })
  revocado: boolean;
}
```

## ⚙️ **Configuración**

### **Variables de Entorno**

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# OAuth Google (opcional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_CALLBACK_URL=http://localhost:3001/api/v1/auth/google/callback

# Rate Limiting
# AUTH_RATE_LIMIT_MAX_IP=5
# AUTH_RATE_LIMIT_WINDOW_IP=15
# AUTH_RATE_LIMIT_MAX_USER=5
# AUTH_RATE_LIMIT_WINDOW_USER=15

# URLs Frontend
FRONTEND_URL=http://localhost:3000
FRONTEND_LOGIN_URL=http://localhost:3000/login
# FRONTEND_RESET_URL=http://localhost:3000/resetear-password
```

## 🔄 **Dependencias de Módulos**

### **Requeridas**

- **Módulo 1**: Configuración (JWT secrets, OAuth, rate limits)
- **Módulo 2**: Base de Datos (TokenUsuario entity)
- **Módulo 3**: Redis (blacklist, rate limiting)
- **Módulo 4**: Respuestas Estandarizadas (formato API)
- **Módulo 6**: Auditoría (eventos de seguridad)
- **Módulo 7**: Usuarios (entidad Usuario, CRUD)

### **Opcionales**

- **Módulo 5**: Logging (logs técnicos)
- **Módulo 12**: Comunicaciones (emails de verificación/recuperación)

## 📝 **Ejemplo de Uso Completo**

### **Flujo de Registro**

```typescript
// 1. Registro
const response = await fetch('/api/v1/auth/registro', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: 'Juan Pérez',
    email: 'juan@ejemplo.com',
    password: 'MiPassword123!',
  }),
});

// 2. Verificación (token recibido por email)
await fetch('/api/v1/auth/verificar-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'token-from-email' }),
});

// 3. Login
const authResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'juan@ejemplo.com',
    password: 'MiPassword123!',
  }),
});

const { accessToken, refreshToken } = await authResponse.json();
```

### **Acceso a Endpoints Protegidos**

```typescript
const response = await fetch('/api/v1/protected/profile', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
```

### **Renovación Automática**

```typescript
const renewResponse = await fetch('/api/v1/auth/renovar-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken }),
});

const { accessToken: newAccessToken } = await renewResponse.json();
```

## 📈 **Monitoreo y Auditoría**

### **Consulta de Logs de Autenticación**

```http
GET /api/v1/auditoria?tabla=usuarios&descripcion=Login
GET /api/v1/auditoria?tabla=usuarios&descripcion=recuperación
GET /api/v1/auditoria?usuarioId=123&fechaInicio=2024-01-01
```

### **Eventos Auditados Automáticamente**

- ✅ Registro de usuarios
- ✅ Verificación de email
- ✅ Login exitoso/fallido
- ✅ Renovación de tokens
- ✅ Logout individual/masivo
- ✅ Solicitud de recuperación
- ✅ Cambio de contraseña
- ✅ OAuth Google

## 🎯 **Beneficios de la Arquitectura**

### **Seguridad**

- Doble validación (JWT + DB) para refresh tokens
- Blacklist eficiente con invalidación masiva
- Tracking completo de dispositivos
- Rate limiting granular

### **Performance**

- Verificación rápida de blacklist (Redis)
- TTL automático para limpieza
- Queries optimizadas en PostgreSQL

### **Mantenibilidad**

- Separación clara de responsabilidades
- Integración con sistema de auditoría existente
- Código reutilizable entre módulos
- Documentación completa de flujos

---

**Sistema de autenticación enterprise-grade con trazabilidad completa y seguridad robusta.**
