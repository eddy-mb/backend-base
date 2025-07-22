import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { AUTH_CONSTANTS, AUTH_MESSAGES } from '../constants/auth.constants';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { RegistroDto } from '../dto/registro.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SolicitarResetDto } from '../dto/solicitar-reset.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { BaseController } from '../../../common/base/base.controller';
import { RequestWithUser } from '../../../common/interfaces/request.interface';
import { Auditable } from '../../auditoria/decorators/auditable.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController extends BaseController {
  constructor(
    private authService: AuthService,
    private configuracionService: ConfiguracionService,
  ) {
    super();
  }

  // Public
  @Post('registro')
  @Auditable({ tabla: 'usuarios', descripcion: 'Registro de usuario' })
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.REGISTER })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado' })
  async registro(@Body() registroDto: RegistroDto) {
    const result = await this.authService.registrarUsuario(registroDto);
    return this.created(result, AUTH_MESSAGES.SUCCESS.REGISTRATION);
  }

  // Public
  @Post('login')
  @Auditable({ tabla: 'usuarios', descripcion: 'Login de usuario' })
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.LOGIN })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const result = await this.authService.iniciarSesion(loginDto, ip);
    return this.success(result, AUTH_MESSAGES.SUCCESS.LOGIN_SUCCESS);
  }

  // Private
  @Post('logout')
  @Auditable({ tabla: 'usuarios', descripcion: 'Logout de usuario' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  async logout(@Req() request: RequestWithUser) {
    const userId = this.getUser(request);
    const token = request.headers.authorization?.replace('Bearer ', '') || '';
    await this.authService.cerrarSesion(userId, token);
    return this.success(null, AUTH_MESSAGES.SUCCESS.LOGOUT);
  }

  // Public
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { refreshToken: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    const accessToken = await this.authService.renovarToken(refreshToken);
    return this.success({ accessToken });
  }

  // Public
  @Get('verificar-email/:token')
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiResponse({ status: 302, description: 'Redirección a frontend' })
  async verificarEmail(
    @Param('token') token: string,
    @Res() response: Response,
  ) {
    try {
      await this.authService.verificarEmail(token);
      const redirectUrl = `${this.configuracionService.aplicacion.frontendUrl}/verificacion-exitosa`;
      response.redirect(redirectUrl);
    } catch {
      const redirectUrl = `${this.configuracionService.aplicacion.frontendUrl}/verificacion-error`;
      response.redirect(redirectUrl);
    }
  }

  // Public
  @Post('reenviar-verificacion')
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.RESEND_VERIFICATION })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar email de verificación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string', format: 'email' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Email enviado' })
  async reenviarVerificacion(@Body('email') email: string) {
    await this.authService.reenviarVerificacion(email);
    return this.success(null, AUTH_MESSAGES.SUCCESS.VERIFICATION_SENT);
  }

  // Public
  @Post('solicitar-reset')
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.RESEND_VERIFICATION })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  @ApiResponse({ status: 200, description: 'Email de reset enviado' })
  async solicitarReset(@Body() solicitarResetDto: SolicitarResetDto) {
    await this.authService.solicitarResetPassword(solicitarResetDto.email);
    return this.success(null, AUTH_MESSAGES.SUCCESS.RESET_SENT);
  }

  // Public
  @Post('reset-password')
  @Auditable({ tabla: 'usuarios', descripcion: 'Reset de contraseña' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña reseteada' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetearPassword(resetPasswordDto);
    return this.success(null, AUTH_MESSAGES.SUCCESS.PASSWORD_RESET);
  }

  // Private
  // @Get('perfil')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  // @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  // obtenerPerfil(@GetUser() user: RequestUser) {
  //   // Este endpoint básico solo retorna la información del usuario
  //   // En el Módulo 9 (Gestión de Usuarios) se expandirá esta funcionalidad
  //   return {
  //     id: user.id,
  //     email: user.email,
  //   };
  // }
}
