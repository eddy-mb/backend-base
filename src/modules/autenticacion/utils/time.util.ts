/**
 * Utilidades para parsing de configuraciones de tiempo
 */
export class TimeUtil {
  /**
   * Parsear tiempo de expiración string a segundos
   */
  static parseExpirationTime(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15min

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
