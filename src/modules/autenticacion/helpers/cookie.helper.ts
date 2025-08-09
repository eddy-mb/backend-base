import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * Helper para manejo de cookies de autenticación
 */
export class AuthCookieHelper {
  /**
   * Configurar cookies usando expiración de tokens JWT
   */
  static setAuthCookies(
    res: Response,
    authData: { accessToken: string; refreshToken: string },
    jwtService: JwtService,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    // Extraer expiración directamente de los JWT
    const accessPayload = jwtService.decode<{ exp: number }>(
      authData.accessToken,
    );
    const refreshPayload = jwtService.decode<{ exp: number }>(
      authData.refreshToken,
    );

    const now = Math.floor(Date.now() / 1000);
    const accessMaxAge = Math.max((accessPayload.exp - now) * 1000, 0);
    const refreshMaxAge = Math.max((refreshPayload.exp - now) * 1000, 0);

    res.cookie('access_token', authData.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: accessMaxAge,
    });

    res.cookie('refresh_token', authData.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: refreshMaxAge,
    });
  }

  /**
   * Limpiar cookies de autenticación
   */
  static clearAuthCookies(res: Response): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }
}
