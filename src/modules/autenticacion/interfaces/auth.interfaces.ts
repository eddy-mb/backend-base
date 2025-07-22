export interface JwtPayload {
  sub: number; // Usuario ID
  email: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TokenValidationResult {
  email: string;
  valido: boolean;
}
