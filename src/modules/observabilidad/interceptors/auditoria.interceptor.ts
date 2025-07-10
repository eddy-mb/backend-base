import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditoriaService } from '../services/auditoria.service';
import { LoggerService } from '../services/logger.service';
import {
  AuditoriaConfig,
  AuditoriaAction,
} from '../interfaces/auditoria.interface';
import {
  RequestWithUser,
  AuditoriaContext,
  AuditoriaErrorMetadata,
} from '../interfaces/interceptor.interface';
import { AUDITORIA_DECORATOR_KEY } from '../constants/auditoria-actions.constants';

/**
 * Interceptor para auditoría automática de operaciones marcadas con @Auditable()
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditoriaService: AuditoriaService,
    private logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const config = this.reflector.get<AuditoriaConfig>(
      AUDITORIA_DECORATOR_KEY,
      context.getHandler(),
    );

    if (!config) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { method, url, params } = request;
    const body: unknown = request.body;

    // Crear contexto base
    const auditContext: Omit<
      AuditoriaContext,
      'valoresAnteriores' | 'valoresNuevos' | 'error'
    > = {
      config,
      accion: this.determineAction(method),
      tabla: config.tableName || this.extractTableFromUrl(url),
      idRegistro: this.extractIdFromParams(params),
      metadata: this.auditoriaService.extractMetadata(context),
    };

    // Validación temprana - si no tenemos datos mínimos, no procesar auditoría
    if (!auditContext.tabla || !auditContext.idRegistro) {
      this.logger.warn(
        'Auditoría: No se pudo determinar tabla o ID del registro',
        {
          context: 'AuditoriaInterceptor',
          url,
          method,
          params,
          tabla: auditContext.tabla,
          idRegistro: auditContext.idRegistro,
        },
      );
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const successContext: AuditoriaContext = {
          ...auditContext,
          valoresAnteriores: null,
          valoresNuevos: this.extractValuesFromResponse(response, body, config),
        };

        this.processAuditoria(successContext).catch((error: Error) => {
          this.logger.logError(error, {
            context: 'AuditoriaInterceptor.tap',
            tabla: auditContext.tabla,
            idRegistro: auditContext.idRegistro,
            accion: auditContext.accion,
          });
        });
      }),
      catchError((error: Error) => {
        const errorContext: AuditoriaContext = {
          ...auditContext,
          error,
        };

        this.processAuditoriaError(errorContext).catch((auditError: Error) => {
          this.logger.logError(auditError, {
            context: 'AuditoriaInterceptor.catchError',
          });
        });
        return throwError(() => error);
      }),
    );
  }

  private determineAction(method: string): AuditoriaAction {
    switch (method.toUpperCase()) {
      case 'POST':
        return AuditoriaAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditoriaAction.UPDATE;
      case 'DELETE':
        return AuditoriaAction.DELETE;
      case 'GET':
        return AuditoriaAction.READ;
      default:
        return AuditoriaAction.UPDATE;
    }
  }

  private extractTableFromUrl(url: string): string | null {
    const match = url.match(/\/api\/v\d+\/([^/]+)/);
    return match ? match[1] : null;
  }

  private extractIdFromParams(params: Record<string, string>): string | null {
    if (!params || Object.keys(params).length === 0) return null;
    return params.id || params.uuid || params.slug || null;
  }

  private extractValuesFromResponse(
    response: unknown,
    body: unknown,
    config: AuditoriaConfig,
  ): unknown {
    if (!config.includeNewValues) return null;

    const responseObj = response as Record<string, unknown>;
    const values = responseObj?.data || response;

    if (!values) return body;

    if (
      config.skipFields &&
      config.skipFields.length > 0 &&
      typeof values === 'object' &&
      values !== null
    ) {
      const filtered = { ...(values as Record<string, unknown>) };
      config.skipFields.forEach((field) => {
        delete filtered[field];
      });
      return filtered;
    }

    return values;
  }

  private async processAuditoria(context: AuditoriaContext): Promise<void> {
    // Type guard: asegurar que tenemos datos válidos (ya validado arriba, pero por seguridad)
    if (!context.tabla || !context.idRegistro) {
      this.logger.warn('Auditoría omitida: falta tabla o idRegistro', {
        context: 'AuditoriaInterceptor.processAuditoria',
        tabla: context.tabla,
        idRegistro: context.idRegistro,
      });
      return;
    }

    const finalMetadata = {
      ...context.metadata,
      ...context.config.customMetadata,
    };

    switch (context.accion) {
      case AuditoriaAction.CREATE:
        await this.auditoriaService.registrarCreacion(
          context.tabla,
          context.idRegistro,
          context.valoresNuevos,
          finalMetadata,
        );
        break;

      case AuditoriaAction.UPDATE:
        await this.auditoriaService.registrarActualizacion(
          context.tabla,
          context.idRegistro,
          context.valoresAnteriores,
          context.valoresNuevos,
          finalMetadata,
        );
        break;

      case AuditoriaAction.DELETE:
        await this.auditoriaService.registrarEliminacion(
          context.tabla,
          context.idRegistro,
          context.valoresAnteriores,
          finalMetadata,
        );
        break;

      default:
        await this.auditoriaService.crear({
          tabla: context.tabla,
          idRegistro: context.idRegistro,
          accion: context.accion,
          valoresAnteriores: context.config.includeOldValues
            ? context.valoresAnteriores
            : null,
          valoresNuevos: context.config.includeNewValues
            ? context.valoresNuevos
            : null,
          usuarioId: context.metadata.userId,
          metadatos: finalMetadata,
        });
    }
  }

  private async processAuditoriaError(
    context: AuditoriaContext,
  ): Promise<void> {
    if (context.accion === AuditoriaAction.READ || !context.error) return;

    // Type guard: asegurar que tenemos datos válidos
    if (!context.tabla || !context.idRegistro) {
      this.logger.warn('Auditoría de error omitida: falta tabla o idRegistro', {
        context: 'AuditoriaInterceptor.processAuditoriaError',
        tabla: context.tabla,
        idRegistro: context.idRegistro,
      });
      return;
    }

    try {
      const errorMetadata: AuditoriaErrorMetadata = {
        ...context.metadata,
        error: {
          name: context.error.name,
          message: context.error.message,
          status: context.error.status || 500,
        },
        success: false,
      };

      await this.auditoriaService.crear({
        tabla: context.tabla,
        idRegistro: context.idRegistro,
        accion: context.accion,
        usuarioId: context.metadata.userId,
        metadatos: errorMetadata,
      });
    } catch (error: unknown) {
      const auditError =
        error instanceof Error ? error : new Error(String(error));
      this.logger.logError(auditError, {
        context: 'AuditoriaInterceptor.processAuditoriaError',
      });
    }
  }
}
