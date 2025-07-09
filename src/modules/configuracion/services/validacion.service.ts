import { Injectable, Logger } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { PrismaService } from '../../database/services/prisma.service';
import {
  EstadoSistema,
  ValidacionConfiguracion,
  DatosConectividad,
} from '../interfaces/configuracion.interface';

// Interface para evitar dependencia circular pero mantener tipado
interface IRedisHealthService {
  ping(): Promise<boolean>;
}

@Injectable()
export class ValidacionService {
  private readonly logger = new Logger(ValidacionService.name);
  private redisHealthService?: IRedisHealthService;

  constructor(
    private configuracionService: ConfiguracionService,
    private prisma: PrismaService,
  ) {}

  /**
   * Inyectar RedisHealthService dinámicamente para evitar dependencia circular
   */
  setRedisHealthService(redisHealthService: IRedisHealthService): void {
    this.redisHealthService = redisHealthService;
  }

  async verificarSaludSistema(): Promise<EstadoSistema> {
    const servicios = {
      baseDatos: await this.verificarBaseDatos(),
      redis: await this.verificarRedis(),
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

  private async verificarRedis(): Promise<'conectado' | 'desconectado'> {
    try {
      const config = this.configuracionService.redis;

      if (!config.host && !config.url) {
        return 'desconectado';
      }

      // Verificación real usando RedisHealthService si está disponible
      if (this.redisHealthService) {
        try {
          const conectado = await this.redisHealthService.ping();
          return conectado ? 'conectado' : 'desconectado';
        } catch (error) {
          this.logger.error('Error en RedisHealthService:', error);
          return 'desconectado';
        }
      }

      // Fallback: verificar solo configuración si RedisHealthService no está disponible
      this.logger.debug(
        'RedisHealthService no disponible, verificando solo configuración',
      );
      return 'conectado'; // Asumimos conectado si la configuración existe
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

  validarConfiguracionCompleta(): ValidacionConfiguracion {
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
        valida,
        errores,
        advertencias,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error durante validación:', errorMessage);
      return {
        valida: false,
        errores: [`Error interno: ${errorMessage}`],
        advertencias,
      };
    }
  }

  async verificarConectividad(): Promise<DatosConectividad> {
    const resultados = {
      baseDatos: false,
      redis: false,
      email: false,
    };

    try {
      // Verificar cada servicio
      resultados.baseDatos = (await this.verificarBaseDatos()) === 'conectado';
      resultados.redis = (await this.verificarRedis()) === 'conectado';
      resultados.email = this.verificarEmail() === 'operativo';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error verificando conectividad:', errorMessage);
    }

    return resultados;
  }
}
