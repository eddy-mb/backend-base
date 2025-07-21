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
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { AUTH_CONSTANTS, AUTH_MESSAGES } from '../constants/auth.constants';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';
import { RegistroDto } from '../dto/registro.dto';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { SolicitarResetDto } from '../dto/solicitar-reset.dto';
import {
  AuthResponseDto,
  TokenResponseDto,
  MensajeResponseDto,
} from '../dto/auth-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { GetUser } from '../decorators/get-user.decorator';
import { RequestUser } from '../interfaces/auth.interfaces';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configuracionService: ConfiguracionService,
  ) {}

  @Public()
  @Post('registro')
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.REGISTER })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Usuario ya existe' })
  async registro(
    @Body() registroDto: RegistroDto,
  ): Promise<MensajeResponseDto> {
    await this.authService.registrarUsuario(registroDto);

    return {
      mensaje: AUTH_MESSAGES.SUCCESS.REGISTRATION,
    };
  }

  @Public()
  @Post('login')
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.LOGIN })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
  ): Promise<AuthResponseDto> {
    return this.authService.iniciarSesion(loginDto, ip);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Logout exitoso' })
  async logout(
    @GetUser() user: RequestUser,
    @Req() request: Request,
  ): Promise<MensajeResponseDto> {
    const token = request.headers.authorization?.replace('Bearer ', '') || '';
    await this.authService.cerrarSesion(user.id, token);

    return {
      mensaje: AUTH_MESSAGES.SUCCESS.LOGOUT,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'Refresh token válido',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<TokenResponseDto> {
    const accessToken = await this.authService.renovarToken(refreshToken);

    return { accessToken };
  }

  @Public()
  @Get('verificar-email/:token')
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiResponse({ status: 302, description: 'Redirección a frontend' })
  @ApiResponse({ status: 400, description: 'Token inválido' })
  async verificarEmail(
    @Param('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    try {
      await this.authService.verificarEmail(token);

      // Redireccionar a página de éxito en frontend
      const redirectUrl = `${this.configuracionService.aplicacion.frontendUrl}/verificacion-exitosa`;
      response.redirect(redirectUrl);
    } catch {
      // Redireccionar a página de error en frontend
      const redirectUrl = `${this.configuracionService.aplicacion.frontendUrl}/verificacion-error`;
      response.redirect(redirectUrl);
    }
  }

  @Public()
  @Post('reenviar-verificacion')
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.RESEND_VERIFICATION })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar email de verificación' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Email de verificación enviado' })
  async reenviarVerificacion(
    @Body('email') email: string,
  ): Promise<MensajeResponseDto> {
    await this.authService.reenviarVerificacion(email);

    return {
      mensaje: AUTH_MESSAGES.SUCCESS.VERIFICATION_SENT,
    };
  }

  @Public()
  @Post('solicitar-reset')
  @Throttle({ default: AUTH_CONSTANTS.RATE_LIMITS.RESEND_VERIFICATION })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar reset de contraseña' })
  @ApiResponse({ status: 200, description: 'Email de reset enviado' })
  async solicitarReset(
    @Body() solicitarResetDto: SolicitarResetDto,
  ): Promise<MensajeResponseDto> {
    await this.authService.solicitarResetPassword(solicitarResetDto.email);

    return {
      mensaje: AUTH_MESSAGES.SUCCESS.RESET_SENT,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  @ApiResponse({
    status: 200,
    description: 'Contraseña reseteada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<MensajeResponseDto> {
    await this.authService.resetearPassword(resetPasswordDto);

    return {
      mensaje: AUTH_MESSAGES.SUCCESS.PASSWORD_RESET,
    };
  }

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
