import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinService } from '../services/casbin.service';
import { RequestWithUser } from '@/common/interfaces/request.interface';
import { Request } from 'express';

/**
 * Guard global de Casbin para autorización automática
 * Se ejecuta después de JwtAuthGuard y verifica permisos automáticamente
 */
@Injectable()
export class CasbinGuard implements CanActivate {
  private readonly logger = new Logger(CasbinGuard.name);

  constructor(
    private readonly casbinService: CasbinService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Si no hay usuario autenticado, denegar acceso
    if (!request.user?.roles || request.user.roles.length === 0) {
      this.logger.warn('Acceso denegado: Usuario sin roles definidos');
      return false;
    }

    // Extraer recurso y acción del contexto
    const { recurso, accion } = this.extraerRecursoYAccion(context);

    this.logger.debug(
      `Verificando autorización: Usuario ${request.user.id} | Roles: [${request.user.roles.join(', ')}] | Recurso: ${recurso} | Acción: ${accion}`,
    );

    // Verificar permisos con cualquier rol del usuario
    for (const rol of request.user.roles) {
      const permitido = await this.casbinService.enforce(rol, recurso, accion);

      if (permitido) {
        this.logger.debug(
          `Acceso autorizado: Rol ${rol} tiene permisos para ${accion} en ${recurso}`,
        );
        return true;
      }
    }

    this.logger.warn(
      `Acceso denegado: Ningún rol del usuario ${request.user.id} tiene permisos para ${accion} en ${recurso}`,
    );

    return false;
  }

  /**
   * Extrae el recurso y acción del contexto de ejecución
   */
  private extraerRecursoYAccion(context: ExecutionContext): {
    recurso: string;
    accion: string;
  } {
    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;

    // Usar el path completo de la ruta para máxima flexibilidad
    const path = request.url;

    // El recurso es la ruta completa para compatibilidad con keyMatch2 y regexMatch
    const recurso = path;

    // Mapear método HTTP a acción
    const accionMap: Record<string, string> = {
      GET: 'GET',
      POST: 'POST',
      PUT: 'PUT',
      PATCH: 'PATCH',
      DELETE: 'DELETE',
    };

    const accion = accionMap[method] || 'GET';

    return { recurso, accion };
  }
}
