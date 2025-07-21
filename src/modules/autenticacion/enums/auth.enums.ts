/**
 * Enums para el módulo de autenticación
 */

export enum EstadoUsuario {
  PENDIENTE_VERIFICACION = 'pendiente_verificacion',
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  SUSPENDIDO = 'suspendido',
}

export enum TipoToken {
  VERIFICACION_EMAIL = 'verificacion_email',
  RESET_PASSWORD = 'reset_password',
}
