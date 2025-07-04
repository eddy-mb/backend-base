import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfiguracionService } from '../services/configuracion.service';
import { Request } from 'express';

@Injectable()
export class ConfiguracionGuard implements CanActivate {
  private readonly logger = new Logger(ConfiguracionGuard.name);

  constructor(private configuracionService: ConfiguracionService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const request: Request = context.switchToHttp().getRequest();

      // TODO: Implementar verificación real de usuario admin cuando tengamos autenticación
      // Por ahora, solo permitimos en desarrollo
      const ambiente = this.configuracionService.aplicacion.ambiente;

      if (ambiente === 'development') {
        this.logger.debug(
          'Acceso permitido a endpoint de configuración en desarrollo',
        );
        return true;
      }

      // En producción, requeriría verificación de usuario admin
      // const usuario = request.user;
      // if (!usuario || !usuario.roles.includes('admin')) {
      //   throw new ForbiddenException('Acceso denegado: se requieren permisos de administrador');
      // }

      // Por ahora, bloqueamos en producción hasta implementar autenticación
      throw new ForbiddenException(
        'Acceso denegado: endpoints de configuración restringidos en producción',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error('Error en ConfiguracionGuard:', errorMessage);
      throw new ForbiddenException(errorMessage);
    }
  }
}
