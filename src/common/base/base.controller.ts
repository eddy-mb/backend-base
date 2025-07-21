import { BadRequestException } from '@nestjs/common';
import {
  ServiceResponse,
  ServicePaginatedResult,
} from '../../modules/respuestas/interfaces/interfaces';
import { RequestWithUser } from '../interfaces/request.interface';

/**
 * Controlador base con helpers para responses y autenticación
 */
export abstract class BaseController {
  // Response helpers
  protected success<T>(data: T, message?: string): ServiceResponse<T> {
    return { data, message };
  }

  protected created<T>(data: T, message?: string): ServiceResponse<T> {
    return { data, message: message || 'Recurso creado exitosamente' };
  }

  protected updated<T>(data: T, message?: string): ServiceResponse<T> {
    return { data, message: message || 'Recurso actualizado exitosamente' };
  }

  protected deleted<T = null>(
    data: T = null as T,
    message?: string,
  ): ServiceResponse<T> {
    return { data, message: message || 'Recurso eliminado exitosamente' };
  }

  protected paginated<T>(
    data: T[],
    total: number,
    message?: string,
  ): ServicePaginatedResult<T> {
    return { data, total, message };
  }

  // Auth helpers
  protected getUser(req: RequestWithUser): number {
    if (req?.user?.id) {
      return req.user.id;
    }
    throw new BadRequestException(
      'Es necesario que esté autenticado para consumir este recurso.',
    );
  }

  protected getRol(req: RequestWithUser): string {
    if (req?.user?.idRol) {
      return String(req.user.idRol);
    }
    throw new BadRequestException(
      'Su cuenta no tiene permisos o roles configurados',
    );
  }
}
