import { SetMetadata } from '@nestjs/common';
import { AuditoriaConfig } from '../interfaces/auditoria.interface';
import {
  AUDITORIA_DECORATOR_KEY,
  DEFAULT_AUDITORIA_CONFIG,
} from '../constants/auditoria-actions.constants';

/**
 * Decorador para marcar métodos que requieren auditoría automática
 *
 * @param config Configuración opcional de auditoría
 *
 * @example
 * ```typescript
 * @Post()
 * @Auditable({ includeNewValues: true })
 * async crearUsuario(@Body() datos: CreateUserDto) {
 *   return this.usuarioService.crear(datos);
 * }
 *
 * @Put(':id')
 * @Auditable({
 *   includeOldValues: true,
 *   includeNewValues: true,
 *   skipFields: ['password']
 * })
 * async actualizarUsuario(@Param('id') id: number, @Body() datos: UpdateUserDto) {
 *   return this.usuarioService.actualizar(id, datos);
 * }
 *
 * @Delete(':id')
 * @Auditable({
 *   includeOldValues: true,
 *   tableName: 'usuarios' // Override automático
 * })
 * async eliminarUsuario(@Param('id') id: number) {
 *   return this.usuarioService.eliminar(id);
 * }
 * ```
 */
export const Auditable = (
  config: Partial<AuditoriaConfig> = {},
): MethodDecorator => {
  const finalConfig = { ...DEFAULT_AUDITORIA_CONFIG, ...config };
  return SetMetadata(AUDITORIA_DECORATOR_KEY, finalConfig);
};

/**
 * Decorador simplificado para auditoría de creación
 */
export const AuditableCreate = (tableName?: string): MethodDecorator => {
  return Auditable({
    includeOldValues: false,
    includeNewValues: true,
    tableName,
  });
};

/**
 * Decorador simplificado para auditoría de actualización
 */
export const AuditableUpdate = (
  tableName?: string,
  skipFields?: string[],
): MethodDecorator => {
  return Auditable({
    includeOldValues: true,
    includeNewValues: true,
    tableName,
    skipFields,
  });
};

/**
 * Decorador simplificado para auditoría de eliminación
 */
export const AuditableDelete = (tableName?: string): MethodDecorator => {
  return Auditable({
    includeOldValues: true,
    includeNewValues: false,
    tableName,
  });
};

/**
 * Decorador para auditoría de solo lectura (operaciones sensibles)
 */
export const AuditableRead = (tableName?: string): MethodDecorator => {
  return Auditable({
    includeOldValues: false,
    includeNewValues: false,
    tableName,
    customMetadata: { operation: 'READ' },
  });
};
