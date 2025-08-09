export enum TipoToken {
  REFRESH = 'refresh',
  VERIFICACION_EMAIL = 'verificacion_email',
  RECUPERACION_PASSWORD = 'recuperacion_password',
}

/**
 * Duraciones de tokens de autenticación
 */
export enum TokenDuration {
  EMAIL_VERIFICATION = '24h',
  PASSWORD_RECOVERY = '1h',
  ACCESS_TOKEN = '15m', // Para referencia configurado en .env
  REFRESH_TOKEN = '7d', // Para referencia configurado en .env
}
