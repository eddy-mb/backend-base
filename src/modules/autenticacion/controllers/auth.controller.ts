import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { BaseController } from '../../../common/base/base.controller';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

import {
  LoginDto,
  RenovarTokenDto,
  RecuperarPasswordDto,
  ConfirmarPasswordDto,
} from '../dto/auth-request.dto';
import {
  AuthResponseDto,
  RenovarResponseDto,
  MessageResponseDto,
} from '../dto/auth-response.dto';

import { RequestInfo } from '../decorators/request-info.decorator';
import { RequestWithUser } from '../../../common/interfaces/request.interface';
import { Auditable, AuditableCritical } from '../../auditoria';

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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Auditable({ tabla: 'usuarios', descripcion: 'Login con credenciales' })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto) {
    const authResponse = await this.authService.login(loginDto);

    return this.success(authResponse, 'Login exitoso');
  }

  @Post('renovar-token')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  // Sin @Auditable - operación muy frecuente (cada 15min por usuario activo)
  @ApiOperation({ summary: 'Renovar token de acceso' })
  @ApiResponse({ status: 200, type: RenovarResponseDto })
  async renovarToken(@Body() renovarTokenDto: RenovarTokenDto) {
    const response = await this.authService.renovarToken(renovarTokenDto);
    return this.success(response, 'Token renovado exitosamente');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Auditable({ tabla: 'usuarios', descripcion: 'Cierre de sesión' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async logout(@Req() req: RequestWithUser) {
    const userId = this.getUser(req);
    const authHeader = req.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    await this.authService.logout(accessToken!, undefined, userId);
    return this.success(null, 'Sesión cerrada exitosamente');
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @AuditableCritical({
    tabla: 'usuarios',
    descripcion: 'Cierre de todas las sesiones',
  })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar todas las sesiones' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async logoutAll(@Req() req: RequestWithUser) {
    const userId = this.getUser(req);
    await this.authService.logoutAll(userId);
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
  async recuperarPassword(@Body() recuperarPasswordDto: RecuperarPasswordDto) {
    await this.authService.solicitarRecuperacionPassword(recuperarPasswordDto);

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
}
