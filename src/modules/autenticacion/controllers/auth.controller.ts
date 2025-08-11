import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { BaseController } from '../../../common/base/base.controller';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import {
  LoginDto,
  VerificarEmailDto,
  RecuperarPasswordDto,
  ConfirmarPasswordDto,
} from '../dto/auth-request.dto';
import {
  MessageResponseDto,
  AuthCookieResponseDto,
} from '../dto/auth-response.dto';

import { RequestInfo } from '../decorators/request-info.decorator';
import { RequestWithUser } from '../../../common/interfaces/request.interface';
import { Auditable, AuditableCritical } from '../../auditoria';
import { CrearUsuarioDto } from '@/modules/usuarios';
import { RequestInfoData } from '../interfaces/auth.interface';
import { AuthCookieHelper } from '../helpers/cookie.helper';

/**
 * Controlador de Autenticación Principal
 * Usa el sistema de auditoría existente con decoradores @Auditable()
 */
@ApiTags('Autenticación')
@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @Auditable({ tabla: 'usuarios', descripcion: 'Registro de usuario' })
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async registrarUsuario(
    @Body() datos: CrearUsuarioDto,
    @RequestInfo() requestInfo: RequestInfoData,
  ) {
    const usuario = await this.authService.registrarUsuario(
      datos,
      requestInfo.ip,
      requestInfo.userAgent,
    );

    return this.created(
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
      'Usuario registrado exitosamente. Revise su email para verificar la cuenta.',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Auditable({ tabla: 'usuarios', descripcion: 'Login con credenciales' })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, type: AuthCookieResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @RequestInfo() requestInfo: RequestInfoData,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authResponse = await this.authService.login(loginDto, requestInfo);

    AuthCookieHelper.setAuthCookies(
      res,
      authResponse,
      this.authService.getJwtService(),
    );

    return this.success(authResponse.usuario, 'Login exitoso');
  }

  @Post('verificar-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Auditable({ tabla: 'usuarios', descripcion: 'Verificación de email' })
  @ApiOperation({ summary: 'Verificar email de usuario' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async verificarEmail(@Body() verificarEmailDto: VerificarEmailDto) {
    await this.authService.verificarEmail(verificarEmailDto);
    return this.success(
      null,
      'Email verificado exitosamente. Su cuenta está ahora activa.',
    );
  }

  @Post('renovar-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, type: AuthCookieResponseDto })
  async renovarToken(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token as string;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token requerido');
    }

    const response = await this.authService.renovarToken({ refreshToken });

    AuthCookieHelper.setAuthCookies(
      res,
      {
        accessToken: response.accessToken,
        refreshToken: refreshToken,
      },
      this.authService.getJwtService(),
    );

    return this.success(null, 'Token renovado exitosamente');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Auditable({ tabla: 'usuarios', descripcion: 'Cierre de sesión' })
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async logout(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = this.getUser(req);
    const accessToken = req.cookies?.access_token as string;
    const refreshToken = req.cookies?.refresh_token as string;

    await this.authService.logout(accessToken, refreshToken, userId);

    AuthCookieHelper.clearAuthCookies(res);

    return this.success(null, 'Sesión cerrada exitosamente');
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @AuditableCritical({
    tabla: 'usuarios',
    descripcion: 'Cierre de todas las sesiones',
  })
  @ApiOperation({ summary: 'Cerrar todas las sesiones' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async logoutAll(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = this.getUser(req);
    await this.authService.logoutAll(userId);

    AuthCookieHelper.clearAuthCookies(res);

    return this.success(null, 'Todas las sesiones han sido cerradas');
  }

  @Post('recuperar-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @AuditableCritical({
    tabla: 'usuarios',
    descripcion: 'Solicitud de recuperación de contraseña',
  })
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async recuperarPassword(
    @Body() recuperarPasswordDto: RecuperarPasswordDto,
    @RequestInfo() requestInfo: RequestInfoData,
  ) {
    await this.authService.solicitarRecuperacionPassword(
      recuperarPasswordDto,
      requestInfo,
    );

    return this.success(
      null,
      'Si el email existe, recibirás un enlace de recuperación',
    );
  }

  @Post('confirmar-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @AuditableCritical({
    tabla: 'usuarios',
    descripcion: 'Cambio de contraseña con token',
  })
  @ApiOperation({ summary: 'Confirmar nueva contraseña' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async confirmarPassword(@Body() confirmarPasswordDto: ConfirmarPasswordDto) {
    await this.authService.confirmarNuevaPassword(confirmarPasswordDto);

    return this.success(
      null,
      'Contraseña actualizada exitosamente. Todas las sesiones han sido cerradas.',
    );
  }

  @Patch('cambiar-rol')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Auditable({ tabla: 'usuarios', descripcion: 'Cambio de rol activo' })
  @ApiOperation({ summary: 'Cambiar rol activo del usuario' })
  @ApiResponse({ status: 200, type: AuthCookieResponseDto })
  async cambiarRol(
    @Body() rol: { nuevoRol: string },
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user!;

    // Delegar lógica completa al AuthService
    const { accessToken, refreshToken } = await this.authService.cambiarRol(
      user.id,
      user.email,
      user.roles || [],
      rol.nuevoRol,
    );

    AuthCookieHelper.setAuthCookies(
      res,
      { accessToken, refreshToken },
      this.authService.getJwtService(),
    );

    return this.success(
      { rolActivo: rol.nuevoRol, roles: user.roles },
      'Rol cambiado exitosamente',
    );
  }
}
