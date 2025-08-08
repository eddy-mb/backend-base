import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfiguracionService } from '../services/configuracion.service';
import { ValidacionService } from '../services/validacion.service';
import { BusinessException } from '../../respuestas';
import { format } from 'date-fns-tz';
import { JwtAuthGuard } from '../../../modules/autenticacion/guards/jwt-auth.guard';
import { CasbinGuard } from '../../../modules/autorizacion/guards/casbin.guard';

@ApiTags('Sistema')
@Controller('sistema')
export class SistemaController {
  constructor(
    private configuracionService: ConfiguracionService,
    private validacionService: ValidacionService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Verificar estado del sistema',
    description:
      'Endpoint público para verificar el estado general del sistema y sus servicios',
  })
  async verificarSalud() {
    const estado = await this.validacionService.verificarSaludSistema();

    // Retornar datos directamente - el interceptor agregará { data: ... }
    return {
      sistema: estado.sistemaOperativo ? 'operativo' : 'degradado',
      version: this.configuracionService.aplicacion.version,
      ambiente: this.configuracionService.aplicacion.ambiente,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss', {
        timeZone: this.configuracionService.aplicacion.timeZone,
      }),
      servicios: estado.servicios,
    };
  }

  @Get('configuracion')
  @UseGuards(JwtAuthGuard, CasbinGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener configuración del sistema',
    description:
      'Obtiene la configuración no sensible del sistema. Requiere permisos de administrador.',
  })
  obtenerConfiguracion() {
    // Retornar datos directamente - el interceptor agregará { data: ... }
    return this.configuracionService.obtenerConfiguracionPublica();
  }

  @Post('validar-configuracion')
  @UseGuards(JwtAuthGuard, CasbinGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validar configuración actual',
    description:
      'Ejecuta una validación completa de la configuración del sistema. Requiere permisos de administrador.',
  })
  validarConfiguracion() {
    const resultado = this.validacionService.validarConfiguracionCompleta();

    if (!resultado.valida && resultado.errores.length > 0) {
      throw BusinessException.businessRuleViolation(
        'CONFIGURACION_INVALIDA',
        'La configuración del sistema contiene errores',
        { errores: resultado.errores, advertencias: resultado.advertencias },
      );
    }

    // Retornar datos directamente - el interceptor agregará { data: ... }
    return resultado;
  }

  @Get('conectividad')
  @UseGuards(JwtAuthGuard, CasbinGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar conectividad de servicios',
    description:
      'Verifica la conectividad con todos los servicios externos. Requiere permisos de administrador.',
  })
  async verificarConectividad() {
    const conectividad = await this.validacionService.verificarConectividad();

    // Retornar datos directamente - el interceptor agregará { data: ... }
    return conectividad;
  }

  @Get('info')
  @ApiOperation({
    summary: 'Información básica del sistema',
    description: 'Obtiene información básica y pública del sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Información básica del sistema',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            version: { type: 'string' },
            ambiente: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  })
  obtenerInfo() {
    // Retornar datos directamente - el interceptor agregará { data: ... }
    return {
      nombre: this.configuracionService.aplicacion.nombre,
      version: this.configuracionService.aplicacion.version,
      ambiente: this.configuracionService.aplicacion.ambiente,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss', {
        timeZone: this.configuracionService.aplicacion.timeZone,
      }),
    };
  }
}
