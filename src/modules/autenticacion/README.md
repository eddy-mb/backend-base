# Módulo 8: Autenticación

## Descripción

Módulo de autenticación JWT con sistema completo de login, logout, recuperación de contraseña y OAuth Google. **Usa el sistema de auditoría existente** con decoradores.

## Características Principales

### 🔐 Autenticación JWT
- Access tokens (15min) y refresh tokens (7d)
- Blacklist en Redis para invalidación inmediata
- Rate limiting por endpoint

### 🛡️ Seguridad
- Protección contra fuerza bruta
- **Auditoría automática con @Auditable() del módulo existente**
- Validación de contraseñas optimizada (frontend valida confirmación)

### 📧 Recuperación de Contraseña
- Tokens seguros temporales
- **Frontend valida confirmación, backend recibe solo password**

## Uso del Sistema de Auditoría

### Decoradores Aplicados
```typescript
import { Auditable, AuditableCritical } from '../../auditoria';

@Post('login')
@Auditable({ tabla: 'usuarios', descripcion: 'Login con credenciales' })
async login() { }

@Post('logout-all')
@AuditableCritical({ tabla: 'usuarios', descripcion: 'Cierre todas sesiones' })
async logoutAll() { }

@Post('recuperar-password')
@AuditableCritical({ tabla: 'usuarios', descripcion: 'Solicitud recuperación' })
async recuperarPassword() { }
```

### Eventos Registrados Automáticamente
- Login exitoso/fallido
- Renovación de tokens
- Logout individual/masivo
- Recuperación de contraseña
- OAuth Google

## API Endpoints

### Autenticación Principal
- `POST /auth/login` - Login con credenciales
- `POST /auth/renovar-token` - Renovar access token
- `POST /auth/logout` - Cerrar sesión actual
- `POST /auth/logout-all` - Cerrar todas las sesiones

### Recuperación de Contraseña
- `POST /auth/recuperar-password` - Solicitar recuperación
- `POST /auth/confirmar-password` - Confirmar nueva contraseña

### OAuth Google
- `GET /auth/google` - Iniciar OAuth
- `GET /auth/google/callback` - Callback OAuth

## DTOs Optimizados

### Confirmación de Contraseña
```typescript
// ✅ Frontend valida, backend recibe solo password final
export class ConfirmarPasswordDto {
  token: string;
  password: string; // Solo password validado
  // confirmPassword eliminado - se valida en frontend
}
```

## Guards Simplificado

### JwtAuthGuard
```typescript
// ✅ Simple: con guard = protegido, sin guard = público
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException('Token requerido');
    }
    return user;
  }
}
```

## Uso en Controllers

### Helper Global (BaseController)
```typescript
@Controller('protected')
export class ProtectedController extends BaseController {
  
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser) {
    const userId = this.getUser(req); // ✅ Helper global
    return { userId };
  }
}
```

### Decoradores Disponibles
```typescript
import { RequestInfo } from '../autenticacion';

@Post('login')
async login(
  @Body() loginDto: LoginDto,
  @RequestInfo() info: { ip: string; userAgent: string }
) { }
```

## Servicios Limpios

### AuthService
- Solo lógica de negocio de autenticación
- **Sin auditoría manual** (manejada por interceptor)
- Integración con UsuariosService del Módulo 7

### JwtTokenService  
- Generación/validación de tokens
- Gestión de blacklist en Redis
- Renovación automática

### OAuthService
- Procesamiento OAuth Google
- **Sin auditoría manual** (manejada por interceptor)

## Configuración

### Variables de Entorno
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
```

## Dependencias

### Módulos Requeridos
- Módulo 1: Configuración
- Módulo 2: Base de Datos  
- Módulo 3: Redis
- Módulo 6: **Auditoría (sistema existente)**
- Módulo 7: Usuarios

### Paquetes NPM
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```

## Consulta de Auditoría

### Ver Logs de Autenticación
```bash
GET /api/v1/auditoria?tabla=usuarios&accion=LOGIN_EXITOSO
GET /api/v1/auditoria?tabla=usuarios&descripcion=recuperación
```

## CORRECCIONES IMPLEMENTADAS

### ✅ 1. Uso del Sistema de Auditoría Existente
- **ANTES**: Auditoría manual en servicios
- **AHORA**: Decoradores @Auditable() del módulo existente
- **BENEFICIO**: Reutilización del sistema implementado

### ✅ 2. Validación Frontend/Backend Correcta  
- **ANTES**: Backend validaba password === confirmPassword
- **AHORA**: Frontend valida, backend recibe solo password
- **BENEFICIO**: Separación correcta de responsabilidades

### ✅ 3. Guard Simplificado
- **ANTES**: Lógica compleja @OptionalAuth innecesaria
- **AHORA**: Simple: con guard = protegido, sin guard = público  
- **BENEFICIO**: Código limpio y directo

### ✅ 4. Helper Global vs Decorador Específico
- **ANTES**: Decorador @CurrentUser() específico del módulo
- **AHORA**: Helper this.getUser(req) del BaseController global
- **BENEFICIO**: Consistencia en toda la aplicación

---

**Sistema de autenticación completo usando la infraestructura existente correctamente.**
