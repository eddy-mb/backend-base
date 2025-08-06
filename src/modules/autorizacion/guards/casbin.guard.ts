import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CasbinService } from '../services/casbin.service';
import { RequestWithUser } from '@/common/interfaces/request.interface';

@Injectable()
export class CasbinGuard implements CanActivate {
  constructor(private readonly casbinService: CasbinService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user?.roles || request.user.roles.length === 0) {
      return false;
    }

    const { recurso, accion } = this.extraerRecursoYAccion(context);

    for (const rol of request.user.roles) {
      if (await this.casbinService.enforce(rol, recurso, accion)) {
        return true;
      }
    }

    return false;
  }

  private extraerRecursoYAccion(context: ExecutionContext): {
    recurso: string;
    accion: string;
  } {
    const request: Request = context.switchToHttp().getRequest();
    const method = request.method;
    const recurso = request.url;

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
