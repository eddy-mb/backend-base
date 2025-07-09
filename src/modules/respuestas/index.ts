/**
 * Módulo 4: Respuestas Estandarizadas - Formato Consistente
 *
 * Implementa formato consistente con wrapper "data" para todas las respuestas HTTP.
 * Todas las respuestas vienen dentro de { data: ... } para máxima consistencia.
 *
 * Características:
 * - Formato consistente para entidades, listas y respuestas paginadas
 * - Todas las respuestas exitosas usan wrapper { data: ... }
 * - Manejo robusto y consistente de errores
 * - Interceptor automático para transformación
 * - Decorador simple para paginación
 * - Utilidades básicas de paginación
 * - Integración automática con class-validator
 * - Configuración cero
 */

// Módulo principal
export { ResponseModule } from './response.module';

// Interfaces y tipos
export * from './interfaces/interfaces';

// Códigos de error (enums)
export * from './constants/error-codes';

// Decorador de paginación
export {
  UsePagination,
  PAGINATION_KEY,
} from './decorators/pagination.decorator';

// Utilidades
export { PaginationUtils } from './utils/pagination.utils';

// Excepciones personalizadas
export {
  ValidationException,
  BusinessException,
} from './exceptions/exceptions';

// Para uso manual si es necesario (casos especiales)
export { ResponseInterceptor } from './interceptors/response.interceptor';
export { ErrorFilter } from './filters/error.filter';
