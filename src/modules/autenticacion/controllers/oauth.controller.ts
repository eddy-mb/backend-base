import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

import { BaseController } from '../../../common/base/base.controller';
import { OAuthService } from '../services/oauth.service';
import { RequestInfo } from '../decorators/request-info.decorator';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { GoogleProfile } from '../interfaces/auth.interface';
import { AuthCookieHelper } from '../helpers/cookie.helper';
import { JwtTokenService } from '../services/jwt-token.service';

// Auditoría - usar el módulo existente
import { Auditable } from '../../auditoria';

/**
 * Controlador OAuth Google
 * Usa el sistema de auditoría existente con decoradores @Auditable()
 */
@ApiTags('OAuth Google')
@Controller('auth/google')
export class OAuthController extends BaseController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configuracionService: ConfiguracionService,
    private readonly jwtTokenService: JwtTokenService,
  ) {
    super();
  }

  @Get()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Iniciar OAuth con Google' })
  async googleAuth() {
    // Redirección automática a Google
  }

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @Auditable({
    tabla: 'usuarios',
    descripcion: 'Login con Google OAuth',
  })
  @ApiOperation({ summary: 'Callback de Google OAuth' })
  async googleAuthRedirect(
    @Req() req: Request,
    @Res() res: Response,
    @RequestInfo() requestInfo: { ip: string; userAgent: string },
  ) {
    const usuario = req.user as GoogleProfile;

    if (!usuario) {
      const frontendUrl = this.configuracionService.aplicacion.frontendUrl;
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    const authResponse = await this.oauthService.loginConGoogle(
      {
        id: usuario.id,
        email: usuario.email,
        name: usuario.name,
        verified_email: usuario.verified_email,
      },
      requestInfo.ip,
      requestInfo.userAgent,
    );

    AuthCookieHelper.setAuthCookies(
      res,
      authResponse,
      this.jwtTokenService.getJwtService(),
    );

    const frontendUrl = this.configuracionService.aplicacion.frontendUrl;
    return res.redirect(`${frontendUrl}/dashboard`);
  }
}
