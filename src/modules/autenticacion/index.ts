// Entities
export { Usuario } from './entities/usuario.entity';
export { TokenVerificacion } from './entities/token-verificacion.entity';

// DTOs
export { RegistroDto } from './dto/registro.dto';
export { LoginDto } from './dto/login.dto';
export { ResetPasswordDto } from './dto/reset-password.dto';
export { SolicitarResetDto } from './dto/solicitar-reset.dto';
export {
  AuthResponseDto,
  TokenResponseDto,
  MensajeResponseDto,
} from './dto/auth-response.dto';

// Interfaces
export {
  JwtPayload,
  GoogleProfile,
  RequestUser,
  AuthTokens,
} from './interfaces/auth.interfaces';

// Services
export { AuthService } from './services/auth.service';
export { JwtTokenService } from './services/jwt.service';
export { TokenService } from './services/token.service';
export { OAuthService } from './services/oauth.service';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { GoogleAuthGuard } from './guards/google-auth.guard';

// Decorators
export { Public } from './decorators/public.decorator';
export { GetUser } from './decorators/get-user.decorator';

// Strategies
export { JwtStrategy } from './strategies/jwt.strategy';
export { GoogleStrategy } from './strategies/google.strategy';

// Repositories
export { UsuarioRepository } from './repositories/usuario.repository';
export { TokenVerificacionRepository } from './repositories/token-verificacion.repository';

// Utils
export { PasswordUtil } from './utils/password.util';

// Enums
export { EstadoUsuario, TipoToken } from './enums/auth.enums';

// Constants
export {
  AUTH_CONSTANTS,
  PASSWORD_VALIDATION,
  AUTH_MESSAGES,
} from './constants/auth.constants';

// Module
export { AutenticacionModule } from './autenticacion.module';
