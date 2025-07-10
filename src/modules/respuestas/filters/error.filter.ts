import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';
import { ErrorResponse } from '../interfaces/interfaces';
import {
  ValidationException,
  BusinessException,
} from '../exceptions/exceptions';
import {
  ValidationCodes,
  SystemCodes,
  AuthCodes,
  ResourceCodes,
  BusinessCodes,
} from '../constants/error-codes';
import { format } from 'date-fns-tz';

/**
 * Filtro global que captura TODAS las excepciones
 * Convierte errores a formato estándar de respuesta
 */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: ErrorResponse;

    // Manejar diferentes tipos de excepciones
    if (exception instanceof ValidationException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse() as ErrorResponse;
    } else if (exception instanceof BusinessException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse() as ErrorResponse;
    } else if (exception instanceof BadRequestException) {
      // Manejar errores de class-validator automáticamente
      const nestResponse = exception.getResponse();
      if (this.isClassValidatorError(nestResponse)) {
        const validationException = ValidationException.fromClassValidator(
          this.extractValidationErrors(nestResponse),
        );
        status = 400;
        errorResponse = validationException.getResponse() as ErrorResponse;
      } else {
        status = 400;
        errorResponse = this.formatHttpException(exception);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorResponse = this.formatHttpException(exception);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = this.formatUnknownError(exception);
    }

    // Log del error
    this.logError(exception, request, status);

    // Enviar respuesta
    response.status(status).json(errorResponse);
  }

  /**
   * Verifica si es un error de class-validator
   */
  private isClassValidatorError(
    response: string | object,
  ): response is { message: unknown[] } {
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      Array.isArray((response as Record<string, unknown>).message)
    );
  }

  /**
   * Extrae ValidationError[] desde respuesta de NestJS
   */
  private extractValidationErrors(
    response: string | object,
  ): ValidationError[] {
    if (!this.isClassValidatorError(response)) {
      return [];
    }

    const messages = response.message;
    if (!Array.isArray(messages)) return [];

    return messages.map((msg): ValidationError => {
      if (typeof msg === 'string') {
        return {
          property: 'field',
          value: undefined,
          constraints: { validation: msg },
          children: [],
        } as ValidationError;
      }

      // Si ya es un ValidationError, retornarlo como está
      if (this.isValidationError(msg)) {
        return msg;
      }

      // Convertir objeto genérico a ValidationError
      return {
        property: (msg as Record<string, unknown>).property || 'field',
        value: (msg as Record<string, unknown>).value,
        constraints: (msg as Record<string, unknown>).constraints || {
          validation: String(msg),
        },
        children: (msg as Record<string, unknown>).children || [],
      } as ValidationError;
    });
  }

  /**
   * Type guard para ValidationError
   */
  private isValidationError(obj: unknown): obj is ValidationError {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'property' in obj &&
      typeof (obj as Record<string, unknown>).property === 'string'
    );
  }

  /**
   * Formatea HttpException estándar
   */
  private formatHttpException(exception: HttpException): ErrorResponse {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string;
    if (typeof response === 'string') {
      message = response;
    } else if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const responseMessage = (response as Record<string, unknown>).message;
      message = Array.isArray(responseMessage)
        ? responseMessage.join(', ')
        : String(responseMessage);
    } else {
      message = exception.message;
    }

    return {
      error: {
        code: this.mapStatusToCode(status),
        message,
      },
    };
  }

  /**
   * Formatea errores desconocidos
   */
  private formatUnknownError(exception: unknown): ErrorResponse {
    let message = 'Error interno del servidor';

    if (exception instanceof Error) {
      message = exception.message || message;
    }

    return {
      error: {
        code: SystemCodes.INTERNAL_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? 'Error interno del servidor'
            : message,
      },
    };
  }

  /**
   * Mapea HTTP status a código de error usando enums correctos
   */
  private mapStatusToCode(status: number): string {
    const mapping: Record<number, string> = {
      400: ValidationCodes.VALIDATION_ERROR,
      401: AuthCodes.UNAUTHORIZED,
      403: AuthCodes.FORBIDDEN,
      404: ResourceCodes.NOT_FOUND,
      409: ResourceCodes.CONFLICT,
      422: BusinessCodes.BUSINESS_RULE_VIOLATION,
      429: SystemCodes.RATE_LIMIT_EXCEEDED,
      500: SystemCodes.INTERNAL_ERROR,
      503: SystemCodes.SERVICE_UNAVAILABLE,
    };

    return mapping[status] || SystemCodes.INTERNAL_ERROR;
  }

  /**
   * Log del error con contexto
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const context = {
      method: request.method,
      url: request.url,
      status,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss', {
        timeZone: process.env.TZ || 'America/La_Paz',
      }),
    };

    if (status >= 500) {
      if (exception instanceof Error) {
        this.logger.error(`${exception.name}: ${exception.message}`, {
          ...context,
          stack: exception.stack,
        });
      } else {
        this.logger.error(`Error desconocido: ${String(exception)}`, context);
      }
    } else if (status >= 400 && process.env.NODE_ENV !== 'production') {
      this.logger.warn(
        `HTTP ${status}: ${request.method} ${request.url}`,
        context,
      );
    }
  }
}
