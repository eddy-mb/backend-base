import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuditoriaService } from '../services/auditoria.service';
import {
  AuditableOptions,
  AccionAuditoria,
  AuditoriaContexto,
  AuditoriaMetadatos,
} from '../interfaces/auditoria.interface';
import {
  AUDITORIA_METADATA_KEY,
  HTTP_METHOD_TO_ACTION,
  REQUEST_HEADERS,
} from '../constants/auditoria.constants';
import { LoggerService } from '@/modules/logging';

/**
 * Request extendido con usuario autenticado
 */
interface RequestWithUser extends Request {
  user?: {
    id?: number;
    sub?: number;
    email?: string;
    [key: string]: unknown;
  };
  params: Record<string, string>;
}

/**
 * Respuesta típica del sistema
 */
interface ResponseObject {
  id?: number | string;
  data?: {
    id?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Tipo específico para handler de controlador NestJS
 */
type ControllerHandler = (...args: unknown[]) => unknown;

/**
 * Tipo específico para constructor de controlador NestJS
 */
type ControllerConstructor = new (...args: unknown[]) => unknown;

type HttpMethod = keyof typeof HTTP_METHOD_TO_ACTION;

/**
 * Interceptor que captura automáticamente las operaciones marcadas con @Auditable()
 * y las registra en el sistema de auditoría
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  // private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditoriaService: AuditoriaService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Intercepta la ejecución del método y registra la auditoría si es necesario
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Verificar si el método tiene la marca @Auditable()
    const auditableOptions = this.reflector.get<AuditableOptions>(
      AUDITORIA_METADATA_KEY,
      context.getHandler(),
    );

    if (!auditableOptions) {
      return next.handle();
    }

    // Extraer información del contexto
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const handler = context.getHandler() as ControllerHandler;
    const controller = context.getClass() as ControllerConstructor;

    // Preparar contexto de auditoría
    const auditoriaContexto = this.extraerContextoAuditoria(
      request,
      controller,
      handler,
      auditableOptions,
    );

    const startTime = Date.now();

    return next.handle().pipe(
      tap((response: unknown) => {
        // Operación exitosa - registrar auditoría de forma asíncrona
        // Usar 'void' para indicar que ignoramos intencionalmente la Promise
        void this.registrarAuditoriaAsync(
          auditoriaContexto,
          auditableOptions,
          request,
          response,
          'exito',
          Date.now() - startTime,
        );
      }),
      catchError((error: Error) => {
        // Operación falló - registrar auditoría con error de forma asíncrona
        // Usar 'void' para indicar que ignoramos intencionalmente la Promise
        void this.registrarAuditoriaAsync(
          auditoriaContexto,
          auditableOptions,
          request,
          null,
          'error',
          Date.now() - startTime,
          error.message,
        );

        throw error;
      }),
    );
  }

  /**
   * Extrae el contexto de auditoría del request
   */
  private extraerContextoAuditoria(
    request: RequestWithUser,
    controller: ControllerConstructor,
    handler: ControllerHandler,
    options: AuditableOptions,
  ): AuditoriaContexto {
    // Extraer información del usuario (si está disponible)
    const usuario = request.user;
    const usuarioId = usuario?.id || usuario?.sub;

    // Extraer IP real considerando proxies
    const ip = this.extraerIPReal(request);

    // Generar correlation ID si no existe
    const correlationId =
      (request.headers[REQUEST_HEADERS.CORRELATION_ID] as string) || uuidv4();

    // Extraer información del controlador y método
    const controllerName = controller.name
      .replace('Controller', '')
      .toLowerCase();
    const methodName = handler.name;

    return {
      usuarioId,
      ip,
      userAgent: request.headers[REQUEST_HEADERS.USER_AGENT] as string,
      correlationId,
      modulo: options.tabla || controllerName,
      metodo: methodName,
      url: request.url,
      httpMethod: request.method,
    };
  }

  /**
   * Extrae la IP real del request considerando proxies
   */
  private extraerIPReal(request: RequestWithUser): string {
    // Orden de prioridad para extraer la IP real
    const possibleIPs: (string | undefined)[] = [
      request.headers[REQUEST_HEADERS.X_FORWARDED_FOR] as string,
      request.headers[REQUEST_HEADERS.X_REAL_IP] as string,
      request.socket?.remoteAddress,
      request.ip,
    ];

    for (const ip of possibleIPs) {
      if (ip && typeof ip === 'string') {
        // Si es X-Forwarded-For, puede tener múltiples IPs separadas por comas
        const cleanIP = ip.split(',')[0].trim();
        if (this.esIPValida(cleanIP)) {
          return cleanIP;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Validación mejorada de IP
   */
  private esIPValida(ip: string): boolean {
    if (!ip || ip === 'unknown') return false;

    // IPv4 simple
    if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') {
      return true;
    }

    // IPv4 básico (suficiente para auditoría)
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // IPv6 básico
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Determina la acción de auditoría
   */
  private determinarAccion(
    httpMethod: string,
    options: AuditableOptions,
  ): AccionAuditoria {
    // Si se especifica explícitamente en las opciones, usar esa
    if (options.accion) {
      return options.accion;
    }

    // Mapear método HTTP a acción
    if (this.esHttpMethodValido(httpMethod)) {
      return HTTP_METHOD_TO_ACTION[httpMethod];
    }

    // Por defecto para métodos no mapeados
    return 'UPDATE';
  }

  /**
   * Type guard para verificar si el método HTTP es válido
   */
  private esHttpMethodValido(method: string): method is HttpMethod {
    return method in HTTP_METHOD_TO_ACTION;
  }

  /**
   * Determina el ID del registro afectado
   */
  private determinarIdRegistro(
    request: RequestWithUser,
    response: unknown,
  ): string {
    // Intentar extraer ID de los parámetros de la URL
    const params = request.params;
    if (params?.id) {
      return params.id.toString();
    }

    // Intentar extraer ID de la respuesta (para operaciones CREATE)
    if (this.esResponseObject(response)) {
      // Respuesta directa
      if (response.id) {
        return response.id.toString();
      }
      // Respuesta con wrapper data (módulo de respuestas)
      if (response.data?.id) {
        return response.data.id.toString();
      }
    }

    return 'unknown';
  }

  /**
   * Type guard para verificar si la respuesta es un objeto válido
   */
  private esResponseObject(response: unknown): response is ResponseObject {
    return (
      response !== null &&
      response !== undefined &&
      typeof response === 'object'
    );
  }

  /**
   * Registra la auditoría de forma asíncrona
   *
   * NOTA: Esta función maneja sus propios errores internamente para no afectar
   * el flujo principal de la aplicación. Los errores se logean pero no se propagan.
   */
  private async registrarAuditoriaAsync(
    contexto: AuditoriaContexto,
    options: AuditableOptions,
    request: RequestWithUser,
    response: unknown,
    resultado: 'exito' | 'error',
    duracion: number,
    mensajeError?: string,
  ): Promise<void> {
    try {
      const accion = this.determinarAccion(contexto.httpMethod!, options);
      const idRegistro = this.determinarIdRegistro(request, response);

      // Construir metadatos si están habilitados
      let metadatos: AuditoriaMetadatos | undefined;

      if (options.incluirMetadatos !== false) {
        metadatos = {
          request: {
            ip: contexto.ip,
            userAgent: contexto.userAgent,
            url: contexto.url,
            method: contexto.httpMethod,
            correlationId: contexto.correlationId,
          },
          usuario: contexto.usuarioId
            ? {
                id: contexto.usuarioId,
              }
            : undefined,
          sistema: {
            modulo: contexto.modulo,
            metodo: contexto.metodo,
            timestamp: new Date(),
            duracion,
          },
          operacion: {
            descripcion: options.descripcion,
            resultado,
            mensaje: resultado === 'error' ? mensajeError : undefined,
          },
        };
      }

      // Registrar la auditoría
      await this.auditoriaService.registrarAuditoria({
        tabla: options.tabla || contexto.modulo!,
        idRegistro,
        accion,
        usuarioId: contexto.usuarioId,
        metadatos,
      });
    } catch (error) {
      // Log del error pero no propagar para no afectar la operación principal
      // Este es el comportamiento deseado: la auditoría falla silenciosamente
      this.logger.errorWithMeta('Error al registrar auditoría', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contexto,
        options,
      });
    }
  }
}
