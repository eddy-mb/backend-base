/**
 * Constantes centralizadas para el módulo de usuarios
 */

// ==================== CONFIGURACIÓN DE AVATARES ====================
export const AVATAR_CONFIG = {
  TIPOS_PERMITIDOS: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ] as const,
  EXTENSIONES_PERMITIDAS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
  TAMANO_MAXIMO: 2 * 1024 * 1024,
  DIRECTORIO: 'avatares',
  PREFIX: 'avatar',
  DIMENSIONES: {
    MIN_WIDTH: 100,
    MIN_HEIGHT: 100,
    MAX_WIDTH: 2000,
    MAX_HEIGHT: 2000,
  },
} as const;

// ==================== CONFIGURACIÓN DE CONTRASEÑAS ====================
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  BCRYPT_ROUNDS: 12,
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
} as const;

// ==================== CONFIGURACIÓN DE LOGIN ====================
export const LOGIN_CONFIG = {
  MAX_INTENTOS: 5,
  TIEMPO_BLOQUEO_MINUTOS: 30,
} as const;

// ==================== MENSAJES ESTANDARIZADOS ====================
export const MENSAJES = {
  USUARIO_CREADO:
    'Usuario registrado exitosamente. Revise su email para verificar la cuenta.',
  EMAIL_VERIFICADO:
    'Email verificado exitosamente. Su cuenta está ahora activa.',
  PERFIL_ACTUALIZADO: 'Perfil actualizado exitosamente',
  AVATAR_SUBIDO: 'Avatar subido exitosamente',
  AVATAR_ELIMINADO: 'Avatar eliminado exitosamente',
  PASSWORD_CAMBIADO: 'Contraseña cambiada exitosamente',
  USUARIO_ELIMINADO: 'Usuario eliminado exitosamente',
  USUARIO_RESTAURADO: 'Usuario restaurado exitosamente',
} as const;

// ==================== TIPOS AUXILIARES ====================
export type TipoMimeAvatar = (typeof AVATAR_CONFIG.TIPOS_PERMITIDOS)[number];
export type ExtensionAvatar =
  (typeof AVATAR_CONFIG.EXTENSIONES_PERMITIDAS)[number];
