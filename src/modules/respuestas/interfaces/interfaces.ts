/**
 * Interfaces para respuestas estandarizadas
 * Formato consistente con wrapper "data" en todas las respuestas
 */

/**
 * Respuesta estándar con wrapper data
 */
export interface StandardResponse<T> {
  data: T;
  message?: string;
}

/**
 * Respuesta paginada estándar
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  message?: string;
}

/**
 * Metadatos de paginación
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Parámetros de paginación de entrada
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Resultado de servicio paginado con mensaje opcional
 */
export interface ServicePaginatedResult<T> {
  data: T[];
  total: number;
  message?: string;
}

/**
 * Respuesta de servicio con mensaje opcional
 */
export interface ServiceResponse<T> {
  data: T;
  message?: string;
}

/**
 * Estructura de error estándar
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Error de campo específico (validaciones)
 */
export interface FieldError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}
