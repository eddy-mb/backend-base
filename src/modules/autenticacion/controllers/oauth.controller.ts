import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { OAuthService } from '../services/oauth.service';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { GoogleProfile } from '../interfaces/auth.interfaces';

// Todos los metodos deben ser publicos

@ApiTags('OAuth')
@Controller('auth')
export class OAuthController {
  constructor(
    private oauthService: OAuthService,
    private configuracionService: ConfiguracionService,
  ) {}

  // Public
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Iniciar autenticación con Google' })
  @ApiResponse({ status: 302, description: 'Redirección a Google OAuth' })
  async googleAuth(): Promise<void> {
    // El guard maneja la redirección a Google
  }

  // Public
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  @ApiResponse({
    status: 302,
    description: 'Redirección a frontend con tokens',
  })
  async googleCallback(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const googleProfile = request.user as GoogleProfile;

      // Procesar OAuth y generar tokens
      const tokens = await this.oauthService.procesarGoogleOAuth(googleProfile);

      // Redireccionar a frontend con tokens en query params
      const frontendUrl = this.configuracionService.aplicacion.frontendUrl;
      const redirectUrl =
        `${frontendUrl}/auth/callback?` +
        `access_token=${tokens.accessToken}&` +
        `refresh_token=${tokens.refreshToken}`;

      response.redirect(redirectUrl);
    } catch (error) {
      // Redireccionar a página de error en frontend
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      const frontendUrl = this.configuracionService.aplicacion.frontendUrl;
      const errorUrl = `${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage)}`;

      response.redirect(errorUrl);
    }
  }
}
