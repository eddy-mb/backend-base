/**
 * Códigos de error estandarizados para APIs REST
 */

/**
 * Errores de validación de datos
 */
export enum ValidationCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_EMAIL = 'INVALID_EMAIL',
  MIN_LENGTH = 'MIN_LENGTH',
  MAX_LENGTH = 'MAX_LENGTH',
  INVALID_VALUE = 'INVALID_VALUE',
}

/**
 * Errores de autenticación y autorización
 */
export enum AuthCodes {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

/**
 * Errores de recursos
 */
export enum ResourceCodes {
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
}

/**
 * Errores del sistema
 */
export enum SystemCodes {
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Errores de negocio
 */
export enum BusinessCodes {
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  INVALID_OPERATION_STATE = 'INVALID_OPERATION_STATE',
}

/**
 * Mapeo de códigos a HTTP status
 */
export const HTTP_STATUS_MAP: Record<string, number> = {
  // Validación -> 400
  [ValidationCodes.VALIDATION_ERROR]: 400,
  [ValidationCodes.REQUIRED_FIELD]: 400,
  [ValidationCodes.INVALID_FORMAT]: 400,
  [ValidationCodes.INVALID_EMAIL]: 400,
  [ValidationCodes.MIN_LENGTH]: 400,
  [ValidationCodes.MAX_LENGTH]: 400,
  [ValidationCodes.INVALID_VALUE]: 400,

  // Auth -> 401/403
  [AuthCodes.UNAUTHORIZED]: 401,
  [AuthCodes.TOKEN_EXPIRED]: 401,
  [AuthCodes.INVALID_CREDENTIALS]: 401,
  [AuthCodes.FORBIDDEN]: 403,

  // Resources -> 404/409
  [ResourceCodes.NOT_FOUND]: 404,
  [ResourceCodes.ALREADY_EXISTS]: 409,
  [ResourceCodes.CONFLICT]: 409,

  // System -> 500/503/429
  [SystemCodes.INTERNAL_ERROR]: 500,
  [SystemCodes.DATABASE_ERROR]: 500,
  [SystemCodes.EXTERNAL_SERVICE_ERROR]: 500,
  [SystemCodes.SERVICE_UNAVAILABLE]: 503,
  [SystemCodes.RATE_LIMIT_EXCEEDED]: 429,

  // Business -> 422
  [BusinessCodes.BUSINESS_RULE_VIOLATION]: 422,
  [BusinessCodes.INSUFFICIENT_FUNDS]: 422,
  [BusinessCodes.OPERATION_NOT_ALLOWED]: 422,
  [BusinessCodes.INVALID_OPERATION_STATE]: 422,
};
