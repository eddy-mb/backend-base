import { SetMetadata } from '@nestjs/common';

/**
 * Clave para metadatos de paginación
 */
export const PAGINATION_KEY = 'usePagination';

/**
 * Decorador para marcar endpoints que devuelven respuestas paginadas
 *
 * @example
 * ```typescript
 * @Get()
 * @UsePagination()
 * async getUsers(@Query() params: any) {
 *   return this.userService.getPaginated(params);
 * }
 * ```
 */
export const UsePagination = (): MethodDecorator => {
  return SetMetadata(PAGINATION_KEY, true);
};
