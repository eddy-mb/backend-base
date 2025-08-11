import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CasbinService } from '../services/casbin.service';
import { RequestWithUser } from '@/common/interfaces/request.interface';
import { Request } from 'express';

@Injectable()
export class CasbinGuard implements CanActivate {
  constructor(private readonly casbinService: CasbinService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Verificar que el usuario esté autenticado
    if (!request.user?.id) {
      return false;
    }

    // Usar rol activo seleccionado por el usuario (más seguro)
    const rolActivo = request.user.rolActivo;

    if (!rolActivo) {
      return false;
    }

    const { recurso, accion } = this.extraerRecursoAccion(context);

    // Verificar permisos solo con el rol activo
    return await this.casbinService.enforce(rolActivo, recurso, accion);
  }

  private extraerRecursoAccion(context: ExecutionContext): {
    recurso: string;
    accion: string;
  } {
    const request: Request = context.switchToHttp().getRequest();
    const accion = request.method;
    const recurso = request.originalUrl.split('?')[0];

    return { recurso, accion };
  }
}
