import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import {
  StandardResponse,
  PaginatedResponse,
  PaginatedResult,
} from '../interfaces/interfaces';
import { PaginationUtils } from '../utils/pagination.utils';
import { PAGINATION_KEY } from '../decorators/pagination.decorator';

/**
 * Interceptor unificado que maneja todos los tipos de respuesta
 * Implementa wrapper consistente con "data" en todas las respuestas
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept<T>(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | PaginatedResponse<unknown> | null> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();

    // Verificar si el endpoint usa paginación
    const usePagination = this.reflector.get<boolean>(PAGINATION_KEY, handler);

    return next.handle().pipe(
      map((data: T) => {
        // Si data es null/undefined, retornar null
        if (data === null || data === undefined) {
          return null;
        }

        // Si está marcado para paginación, aplicar formato paginado
        if (usePagination) {
          return this.handlePaginatedResponse(data, request);
        }

        // Para todo lo demás, retornar dentro de "data"
        return { data };
      }),
    );
  }

  /**
   * Maneja respuestas paginadas
   */
  private handlePaginatedResponse<T>(
    data: T,
    request: Request,
  ): PaginatedResponse<unknown> | StandardResponse<T> {
    // Extraer parámetros de paginación de la request
    const params = PaginationUtils.fromQuery(request.query);

    // Caso: resultado en formato [T[], number]
    if (this.isTupleResult<unknown>(data)) {
      const [items, total] = data;
      const meta = PaginationUtils.calculateMeta(total, params);
      return {
        data: items,
        pagination: meta,
      };
    }

    // Si ya es un resultado paginado del servicio
    if (this.isPaginatedResult<unknown>(data)) {
      const meta = PaginationUtils.calculateMeta(data.total, params);
      return {
        data: data.data,
        pagination: meta,
      };
    }

    // Si es un array simple, tratarlo como página única
    if (Array.isArray(data)) {
      const meta = PaginationUtils.calculateMeta(data.length, params);
      return {
        data,
        pagination: meta,
      };
    }

    // Si no es paginable, retornar dentro de "data" (fallback)
    return { data };
  }

  /**
   * Verifica si los datos tienen estructura de resultado paginado
   */
  private isPaginatedResult<T>(data: unknown): data is PaginatedResult<T> {
    return (
      typeof data === 'object' &&
      data !== null &&
      'data' in data &&
      'total' in data &&
      Array.isArray(data.data) &&
      typeof data.total === 'number'
    );
  }

  /**
   * Verifica si los datos tienen estructura de tupla
   */

  private isTupleResult<T>(data: unknown): data is [T[], number] {
    return (
      Array.isArray(data) &&
      data.length === 2 &&
      Array.isArray(data[0]) &&
      typeof data[1] === 'number'
    );
  }
}
