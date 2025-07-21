/**
 * Constantes del módulo de autenticación (configuración técnica)
 */

export const AUTH_CONSTANTS = {
  // Rate limiting
  RATE_LIMITS: {
    LOGIN: { limit: 5, ttl: 900000 }, // 5 intentos por 15 minutos
    REGISTER: { limit: 3, ttl: 900000 }, // 3 registros por 15 minutos
    RESET_PASSWORD: { limit: 3, ttl: 3600000 }, // 3 intentos por hora
    RESEND_VERIFICATION: { limit: 3, ttl: 3600000 }, // 3 intentos por hora
  },

  // Expiración de tokens
  TOKEN_EXPIRY: {
    EMAIL_VERIFICATION: 24, // horas
    PASSWORD_RESET: 1, // hora
  },

  // Redis keys
  REDIS_KEYS: {
    BLACKLIST: 'blacklist',
    LOGIN_ATTEMPTS: 'login_attempts',
    RESET_ATTEMPTS: 'reset_attempts',
    RESEND_VERIFICATION: 'resend_verification',
  },

  // Configuración de bcrypt
  BCRYPT_ROUNDS: 12,

  // Longitud mínima de contraseña
  MIN_PASSWORD_LENGTH: 8,
};

/**
 * Configuración de validación de contraseñas
 */
export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
};

/**
 * Mensajes de error y éxito
 */
export const AUTH_MESSAGES = {
  ERRORS: {
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    ACCOUNT_NOT_VERIFIED: 'Cuenta no verificada. Revise su email.',
    ACCOUNT_DELETED:
      'Esta cuenta fue desactivada y no puede volver a ser utilizada.',
    ACCOUNT_INACTIVE: 'Cuenta inactiva. Contacte al administrador.',
    TOO_MANY_ATTEMPTS: 'Demasiados intentos. Intente más tarde.',
    TOKEN_INVALID: 'Token inválido o expirado',
    EMAIL_ALREADY_EXISTS: 'El email ya está registrado',
    USER_NOT_FOUND: 'Usuario no encontrado',
  },
  SUCCESS: {
    REGISTRATION:
      'Usuario registrado exitosamente. Revise su email para verificar la cuenta.',
    EMAIL_VERIFIED: 'Email verificado exitosamente',
    PASSWORD_RESET: 'Contraseña reseteada exitosamente',
    LOGOUT: 'Sesión cerrada exitosamente',
    VERIFICATION_SENT: 'Email de verificación enviado',
    RESET_SENT:
      'Si el email existe, recibirá instrucciones para resetear su contraseña.',
  },
};
