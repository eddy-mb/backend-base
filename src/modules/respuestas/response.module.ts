import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { ErrorFilter } from './filters/error.filter';
import { PaginationUtils } from './utils/pagination.utils';

/**
 * Módulo global para respuestas estandarizadas
 *
 * Características:
 * - Respuestas HTTP consistentes siguiendo estándares de industria
 * - Formato consistente con wrapper { data: ... }
 * - Paginación automática con @UsePagination()
 * - Manejo unificado de errores
 * - Configuración cero - funciona out-of-the-box
 * - Integración automática con class-validator
 * - Factory methods para excepciones comunes
 */
@Global()
@Module({
  providers: [
    // Interceptor global para formatear respuestas
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // Filtro global para manejar errores
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },

    // Utilidades disponibles para inyección
    PaginationUtils,
  ],
  exports: [
    // Exportar utilidades para uso directo en servicios
    PaginationUtils,
  ],
})
export class ResponseModule {
  /**
   * Configuración del módulo para imports
   * No requiere configuración adicional
   */
  static forRoot() {
    return {
      module: ResponseModule,
    };
  }
}
