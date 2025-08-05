/**
 * Interfaces del Módulo de Autenticación
 */

/**
 * Payload del JWT - estructura estándar
 */
export interface JwtPayload {
  sub: string; // userId (subject)
  email: string;
  iat: number; // issued at
  exp: number; // expiration
  type: 'access' | 'refresh';
}

/**
 * Contexto de autenticación para requests
 */
export interface AuthContext {
  usuario: {
    id: string;
    email: string;
    nombre: string;
    roles?: string[];
  };
  token: string;
  payload: JwtPayload;
  ip?: string;
  userAgent?: string;
}

/**
 * Respuesta de login/registro
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // segundos
}

/**
 * Información del usuario en respuesta de auth
 */
export interface AuthUserInfo {
  id: string;
  email: string;
  nombre: string;
  estado: string;
  emailVerificado: boolean;
  ultimaActividad?: Date;
}

/**
 * Respuesta completa de autenticación
 */
export interface AuthResponse extends AuthTokens {
  usuario: AuthUserInfo;
}

/**
 * Perfil OAuth de Google
 */
export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

/**
 * Resultado de validación de token
 */
export interface TokenValidationResult {
  isValid: boolean;
  payload?: JwtPayload;
  error?: string;
}

/**
 * Información del request (IP, User-Agent)
 */
export interface RequestInfoData {
  ip: string;
  userAgent: string;
}
