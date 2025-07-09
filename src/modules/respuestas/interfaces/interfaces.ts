/**
 * Interfaces para respuestas estandarizadas
 * Formato consistente con wrapper "data" en todas las respuestas
 */

/**
 * Respuesta estándar con wrapper data
 */
export interface StandardResponse<T> {
  data: T;
}

/**
 * Respuesta paginada estándar
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
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
 * Resultado de servicio paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
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

/**
 * Parámetros de query estándar para listados
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Información de rango para paginación
 */
export interface RangeInfo {
  start: number;
  end: number;
  showing: number;
}
