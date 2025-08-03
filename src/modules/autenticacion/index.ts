// Módulo principal
export { AutenticacionModule } from './autenticacion.module';

// Servicios
export { AuthService } from './services/auth.service';
export { JwtTokenService } from './services/jwt-token.service';
export { OAuthService } from './services/oauth.service';

// Controladores
export { AuthController } from './controllers/auth.controller';
export { OAuthController } from './controllers/oauth.controller';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';

// Strategies
export { JwtStrategy } from './strategies/jwt.strategy';
export { GoogleStrategy } from './strategies/google.strategy';

// Decoradores útiles
export { RequestInfo } from './decorators/request-info.decorator';

// DTOs
export * from './dto/auth-request.dto';
export * from './dto/auth-response.dto';

// Interfaces
export * from './interfaces/auth.interface';
