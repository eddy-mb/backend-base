import { SetMetadata } from '@nestjs/common';
import { AuditableOptions } from '../interfaces/auditoria.interface';
import { AUDITORIA_METADATA_KEY } from '../constants/auditoria.constants';

/**
 * Decorador para marcar métodos que requieren auditoría automática
 *
 * Este decorador se aplica a métodos de controladores o servicios para
 * registrar automáticamente las operaciones realizadas en el sistema.
 *
 * @param options - Opciones de configuración para la auditoría
 *
 * @example
 * ```typescript
 * @Controller('usuarios')
 * export class UsuarioController {
 *
 *   @Post()
 *   @Auditable({ tabla: 'usuarios', descripcion: 'Creación de usuario' })
 *   async crearUsuario(@Body() datos: CreateUsuarioDto) {
 *     return this.usuarioService.crear(datos);
 *   }
 *
 *   @Put(':id')
 *   @Auditable({ tabla: 'usuarios' }) // La acción se infiere del método HTTP
 *   async actualizarUsuario(@Param('id') id: number, @Body() datos: UpdateUsuarioDto) {
 *     return this.usuarioService.actualizar(id, datos);
 *   }
 *
 *   @Delete(':id')
 *   @Auditable({ tabla: 'usuarios', incluirMetadatos: true })
 *   async eliminarUsuario(@Param('id') id: number) {
 *     return this.usuarioService.eliminar(id);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Uso en servicios
 * @Injectable()
 * export class UsuarioService {
 *
 *   @Auditable({
 *     tabla: 'usuarios',
 *     accion: 'UPDATE',
 *     descripcion: 'Cambio de contraseña'
 *   })
 *   async cambiarPassword(id: number, nuevaPassword: string) {
 *     // Lógica de cambio de contraseña
 *   }
 * }
 * ```
 */
export const Auditable = (options: AuditableOptions = {}): MethodDecorator => {
  // Configuración por defecto
  const defaultOptions: AuditableOptions = {
    incluirMetadatos: true,
    ...options,
  };

  return SetMetadata(AUDITORIA_METADATA_KEY, defaultOptions);
};

/**
 * Decorador específico para operaciones de creación
 * Equivale a @Auditable({ accion: 'CREATE' })
 *
 * @param options - Opciones adicionales (tabla es requerida)
 *
 * @example
 * ```typescript
 * @Post()
 * @AuditableCreate({ tabla: 'usuarios' })
 * async crearUsuario(@Body() datos: CreateUsuarioDto) {
 *   return this.usuarioService.crear(datos);
 * }
 * ```
 */
export const AuditableCreate = (
  options: Omit<AuditableOptions, 'accion'>,
): MethodDecorator => {
  return Auditable({ ...options, accion: 'CREATE' });
};

/**
 * Decorador específico para operaciones de actualización
 * Equivale a @Auditable({ accion: 'UPDATE' })
 *
 * @param options - Opciones adicionales (tabla es requerida)
 *
 * @example
 * ```typescript
 * @Put(':id')
 * @AuditableUpdate({ tabla: 'usuarios' })
 * async actualizarUsuario(@Param('id') id: number, @Body() datos: UpdateUsuarioDto) {
 *   return this.usuarioService.actualizar(id, datos);
 * }
 * ```
 */
export const AuditableUpdate = (
  options: Omit<AuditableOptions, 'accion'>,
): MethodDecorator => {
  return Auditable({ ...options, accion: 'UPDATE' });
};

/**
 * Decorador específico para operaciones de eliminación
 * Equivale a @Auditable({ accion: 'DELETE' })
 *
 * @param options - Opciones adicionales (tabla es requerida)
 *
 * @example
 * ```typescript
 * @Delete(':id')
 * @AuditableDelete({ tabla: 'usuarios' })
 * async eliminarUsuario(@Param('id') id: number) {
 *   return this.usuarioService.eliminar(id);
 * }
 * ```
 */
export const AuditableDelete = (
  options: Omit<AuditableOptions, 'accion'>,
): MethodDecorator => {
  return Auditable({ ...options, accion: 'DELETE' });
};

/**
 * Decorador para auditoría silenciosa (sin metadatos extensos)
 * Útil para operaciones frecuentes donde no se necesita información detallada
 *
 * @param options - Opciones de configuración
 *
 * @example
 * ```typescript
 * @Get(':id')
 * @AuditableSilent({ tabla: 'usuarios', accion: 'READ' })
 * async obtenerUsuario(@Param('id') id: number) {
 *   return this.usuarioService.buscarPorId(id);
 * }
 * ```
 */
export const AuditableSilent = (options: AuditableOptions): MethodDecorator => {
  return Auditable({ ...options, incluirMetadatos: false });
};

/**
 * Decorador para auditoría crítica (con máximo detalle)
 * Útil para operaciones sensibles que requieren trazabilidad completa
 *
 * @param options - Opciones de configuración
 *
 * @example
 * ```typescript
 * @Post('admin/cambiar-rol')
 * @AuditableCritical({ tabla: 'usuarios', descripcion: 'Cambio de rol administrativo' })
 * async cambiarRol(@Body() datos: CambiarRolDto) {
 *   return this.usuarioService.cambiarRol(datos);
 * }
 * ```
 */
export const AuditableCritical = (
  options: AuditableOptions,
): MethodDecorator => {
  return Auditable({
    ...options,
    incluirMetadatos: true,
    descripcion: `[CRÍTICO] ${options.descripcion || 'Operación crítica'}`,
  });
};
