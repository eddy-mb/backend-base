import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ErrorResponse, FieldError } from '../interfaces/interfaces';
import {
  ValidationCodes,
  BusinessCodes,
  ResourceCodes,
  HTTP_STATUS_MAP,
} from '../constants/error-codes';

/**
 * Excepción para errores de validación
 */
export class ValidationException extends HttpException {
  constructor(
    errors: FieldError[],
    message = 'Los datos proporcionados no son válidos',
  ) {
    const response: ErrorResponse = {
      error: {
        code: ValidationCodes.VALIDATION_ERROR,
        message,
        details: { errors },
      },
    };

    super(response, HttpStatus.BAD_REQUEST);
    this.name = 'ValidationException';
  }

  /**
   * Crea excepción desde errores de class-validator
   */
  static fromClassValidator(
    validationErrors: ValidationError[],
  ): ValidationException {
    const errors: FieldError[] = [];

    for (const error of validationErrors) {
      this.processValidationError(error, errors);
    }

    return new ValidationException(errors);
  }

  /**
   * Procesa un ValidationError y sus hijos recursivamente
   */
  private static processValidationError(
    error: ValidationError,
    errors: FieldError[],
    parentPath = '',
  ): void {
    const fieldPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    // Procesar constraints del error actual
    if (error.constraints) {
      for (const [constraintKey, message] of Object.entries(
        error.constraints,
      )) {
        errors.push({
          field: fieldPath,
          message: message || 'Valor inválido',
          code: this.mapConstraintToCode(constraintKey),
          value: error.value,
        });
      }
    }

    // Procesar errores hijos recursivamente
    if (error.children && error.children.length > 0) {
      for (const child of error.children) {
        this.processValidationError(child, errors, fieldPath);
      }
    }
  }

  /**
   * Crea excepción desde un solo campo
   */
  static fromField(
    field: string,
    message: string,
    code = ValidationCodes.INVALID_VALUE,
    value?: unknown,
  ): ValidationException {
    return new ValidationException([{ field, message, code, value }]);
  }

  /**
   * Mapea constraints de class-validator a códigos de error
   */
  private static mapConstraintToCode(constraintKey: string): string {
    const mapping: Record<string, string> = {
      isNotEmpty: ValidationCodes.REQUIRED_FIELD,
      isEmail: ValidationCodes.INVALID_EMAIL,
      minLength: ValidationCodes.MIN_LENGTH,
      maxLength: ValidationCodes.MAX_LENGTH,
      isString: ValidationCodes.INVALID_FORMAT,
      isNumber: ValidationCodes.INVALID_FORMAT,
      isInt: ValidationCodes.INVALID_FORMAT,
      isDecimal: ValidationCodes.INVALID_FORMAT,
      isBoolean: ValidationCodes.INVALID_FORMAT,
      isDate: ValidationCodes.INVALID_FORMAT,
      isUrl: ValidationCodes.INVALID_FORMAT,
      isUUID: ValidationCodes.INVALID_FORMAT,
      matches: ValidationCodes.INVALID_FORMAT,
      min: ValidationCodes.INVALID_VALUE,
      max: ValidationCodes.INVALID_VALUE,
      isPositive: ValidationCodes.INVALID_VALUE,
      isNegative: ValidationCodes.INVALID_VALUE,
    };

    return mapping[constraintKey] || ValidationCodes.INVALID_VALUE;
  }
}

/**
 * Excepción para errores de negocio
 */
export class BusinessException extends HttpException {
  public readonly code: string;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
  ) {
    const response: ErrorResponse = {
      error: {
        code,
        message,
        details,
      },
    };

    const status = HTTP_STATUS_MAP[code] || HttpStatus.UNPROCESSABLE_ENTITY;
    super(response, status);

    this.code = code;
    this.name = 'BusinessException';
  }

  /**
   * Factory methods para casos comunes
   */

  /**
   * Error cuando un recurso no es encontrado
   */
  static notFound(resource: string, id: string | number): BusinessException {
    return new BusinessException(
      ResourceCodes.NOT_FOUND,
      `${resource} con ID '${id}' no fue encontrado`,
      { resource, id },
    );
  }

  /**
   * Error cuando un recurso ya existe
   */
  static alreadyExists(
    resource: string,
    field: string,
    value: unknown,
  ): BusinessException {
    return new BusinessException(
      ResourceCodes.ALREADY_EXISTS,
      `Ya existe un ${resource} con ${field} '${String(value)}'`,
      { resource, field, value },
    );
  }

  /**
   * Error cuando una operación no está permitida
   */
  static operationNotAllowed(
    operation: string,
    reason: string,
  ): BusinessException {
    return new BusinessException(
      BusinessCodes.OPERATION_NOT_ALLOWED,
      `La operación '${operation}' no está permitida: ${reason}`,
      { operation, reason },
    );
  }

  /**
   * Error de fondos insuficientes (para casos financieros)
   */
  static insufficientFunds(
    currentBalance: number,
    requiredAmount: number,
  ): BusinessException {
    return new BusinessException(
      BusinessCodes.INSUFFICIENT_FUNDS,
      'Fondos insuficientes para completar la operación',
      {
        currentBalance,
        requiredAmount,
        deficit: requiredAmount - currentBalance,
      },
    );
  }

  /**
   * Error cuando el estado del recurso no permite la operación
   */
  static invalidState(
    currentState: string,
    allowedStates: string[],
    resource: string,
  ): BusinessException {
    return new BusinessException(
      BusinessCodes.INVALID_OPERATION_STATE,
      `El ${resource} está en estado '${currentState}' pero se requiere: ${allowedStates.join(', ')}`,
      { currentState, allowedStates, resource },
    );
  }

  /**
   * Error genérico de conflicto de recursos
   */
  static conflict(resource: string, reason: string): BusinessException {
    return new BusinessException(
      ResourceCodes.CONFLICT,
      `Conflicto con ${resource}: ${reason}`,
      { resource, reason },
    );
  }

  /**
   * Error genérico de regla de negocio violada
   */
  static businessRuleViolation(
    rule: string,
    message: string,
    details?: Record<string, unknown>,
  ): BusinessException {
    return new BusinessException(
      BusinessCodes.BUSINESS_RULE_VIOLATION,
      `Regla de negocio violada (${rule}): ${message}`,
      { rule, ...details },
    );
  }
}
