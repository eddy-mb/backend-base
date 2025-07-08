import { Injectable, Logger } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { PrismaService } from '../../database/services/prisma.service';
import {
  EstadoSistema,
  RespuestaValidacion,
} from '../interfaces/configuracion.interface';

@Injectable()
export class ValidacionService {
  private readonly logger = new Logger(ValidacionService.name);

  constructor(
    private configuracionService: ConfiguracionService,
    private prisma: PrismaService,
  ) {}

  async verificarSaludSistema(): Promise<EstadoSistema> {
    const servicios = {
      baseDatos: await this.verificarBaseDatos(),
      redis: this.verificarRedis(),
      email: this.verificarEmail(),
    };

    const sistemaOperativo = Object.values(servicios).every(
      (estado) => estado === 'conectado' || estado === 'operativo',
    );

    return {
      sistemaOperativo,
      servicios,
    };
  }

  private async verificarBaseDatos(): Promise<'conectado' | 'desconectado'> {
    try {
      const config = this.configuracionService.baseDatos;

      if (!config.url) {
        return 'desconectado';
      }

      // Verificación real usando PrismaService
      const conectado = await this.prisma.verificarConexion();
      return conectado ? 'conectado' : 'desconectado';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error verificando base de datos:', errorMessage);
      return 'desconectado';
    }
  }

  private verificarRedis(): 'conectado' | 'desconectado' {
    try {
      const config = this.configuracionService.redis;

      if (!config.host && !config.url) {
        return 'desconectado';
      }

      // TODO: Implementar verificación real cuando tengamos Redis client
      // Por ahora simulamos la verificación

      return 'conectado';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error verificando Redis:', errorMessage);
      return 'desconectado';
    }
  }

  private verificarEmail(): 'operativo' | 'inoperativo' {
    try {
      const emailHabilitado =
        this.configuracionService.caracteristicaHabilitada('email');

      if (!emailHabilitado) {
        return 'inoperativo';
      }

      // TODO: Implementar verificación real del servicio de email
      // Por ahora asumimos que está operativo si está configurado

      return 'operativo';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error verificando email:', errorMessage);
      return 'inoperativo';
    }
  }

  validarConfiguracionCompleta(): RespuestaValidacion {
    const errores: string[] = [];
    const advertencias: string[] = [];

    try {
      // Validar configuraciones críticas
      const config = this.configuracionService;

      // Validar base de datos
      if (!config.baseDatos.url) {
        errores.push('DATABASE_URL es requerida');
      }

      // Validar seguridad
      if (
        !config.seguridad.jwtSecret ||
        config.seguridad.jwtSecret.length < 32
      ) {
        errores.push('JWT_SECRET debe tener al menos 32 caracteres');
      }

      if (
        !config.seguridad.encryptionKey ||
        config.seguridad.encryptionKey.length < 32
      ) {
        errores.push('ENCRYPTION_KEY debe tener al menos 32 caracteres');
      }

      // Validar URLs
      if (!config.aplicacion.frontendUrl) {
        errores.push('FRONTEND_URL es requerida');
      }

      if (!config.aplicacion.apiUrl) {
        errores.push('API_URL es requerida');
      }

      // Advertencias para configuraciones opcionales
      if (!config.caracteristicaHabilitada('email')) {
        advertencias.push('Servicio de email no configurado');
      }

      if (!config.caracteristicaHabilitada('redis')) {
        advertencias.push(
          'Redis no configurado - algunas funcionalidades pueden estar limitadas',
        );
      }

      if (config.aplicacion.ambiente === 'production') {
        if (config.seguridad.corsOrigin === '*') {
          advertencias.push(
            'CORS configurado para aceptar cualquier origen en producción',
          );
        }

        if (config.aplicacion.logLevel === 'debug') {
          advertencias.push('Log level DEBUG no recomendado en producción');
        }
      }

      const valida = errores.length === 0;

      if (valida) {
        this.logger.log('Configuración validada exitosamente');
      } else {
        this.logger.error(`Configuración inválida: ${errores.join(', ')}`);
      }

      if (advertencias.length > 0) {
        this.logger.warn(
          `Advertencias de configuración: ${advertencias.join(', ')}`,
        );
      }

      return {
        exito: true,
        datos: {
          valida,
          errores,
          advertencias,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error durante validación:', errorMessage);
      return {
        exito: false,
        datos: {
          valida: false,
          errores: [`Error interno: ${errorMessage}`],
          advertencias,
        },
      };
    }
  }

  async verificarConectividad(): Promise<{ [servicio: string]: boolean }> {
    const resultados = {
      baseDatos: false,
      redis: false,
      email: false,
    };

    try {
      // Verificar cada servicio
      resultados.baseDatos = (await this.verificarBaseDatos()) === 'conectado';
      resultados.redis = this.verificarRedis() === 'conectado';
      resultados.email = this.verificarEmail() === 'operativo';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error verificando conectividad:', errorMessage);
    }

    return resultados;
  }
}
