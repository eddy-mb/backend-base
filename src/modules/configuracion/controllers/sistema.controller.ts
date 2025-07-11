import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfiguracionService } from '../services/configuracion.service';
import { ValidacionService } from '../services/validacion.service';
import { ConfiguracionGuard } from '../guards/configuracion.guard';
import { BusinessException } from '../../respuestas';
import { format } from 'date-fns-tz';

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
  @ApiResponse({
    status: 200,
    description: 'Estado del sistema',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            sistema: {
              type: 'string',
              enum: ['operativo', 'degradado', 'inoperativo'],
            },
            version: { type: 'string' },
            ambiente: { type: 'string' },
            timestamp: { type: 'string' },
            servicios: {
              type: 'object',
              properties: {
                baseDatos: {
                  type: 'string',
                  enum: ['conectado', 'desconectado'],
                },
                redis: { type: 'string', enum: ['conectado', 'desconectado'] },
                email: { type: 'string', enum: ['operativo', 'inoperativo'] },
              },
            },
          },
        },
      },
    },
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
  @UseGuards(ConfiguracionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener configuración del sistema',
    description:
      'Obtiene la configuración no sensible del sistema. Requiere permisos de administrador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración no sensible del sistema',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            aplicacion: {
              type: 'object',
              properties: {
                nombre: { type: 'string' },
                version: { type: 'string' },
                ambiente: { type: 'string' },
              },
            },
            caracteristicas: {
              type: 'object',
              properties: {
                email: { type: 'boolean' },
                storage: { type: 'string', enum: ['local', 's3'] },
                redis: { type: 'boolean' },
              },
            },
            limites: {
              type: 'object',
              properties: {
                rateLimitMax: { type: 'number' },
                rateLimitWindow: { type: 'number' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - se requieren permisos de administrador',
  })
  obtenerConfiguracion() {
    // Retornar datos directamente - el interceptor agregará { data: ... }
    return this.configuracionService.obtenerConfiguracionPublica();
  }

  @Post('validar-configuracion')
  @UseGuards(ConfiguracionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validar configuración actual',
    description:
      'Ejecuta una validación completa de la configuración del sistema. Requiere permisos de administrador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            valida: { type: 'boolean' },
            errores: { type: 'array', items: { type: 'string' } },
            advertencias: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - se requieren permisos de administrador',
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
  @UseGuards(ConfiguracionGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar conectividad de servicios',
    description:
      'Verifica la conectividad con todos los servicios externos. Requiere permisos de administrador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de conectividad de servicios',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            baseDatos: { type: 'boolean' },
            redis: { type: 'boolean' },
            email: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado - se requieren permisos de administrador',
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
