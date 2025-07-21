import * as bcrypt from 'bcryptjs';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

export class PasswordUtil {
  private static readonly SALT_ROUNDS = AUTH_CONSTANTS.BCRYPT_ROUNDS;

  /**
   * Hashea una contraseña usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compara una contraseña en texto plano con su hash
   */
  static async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Genera una contraseña aleatoria segura
   */
  static generateRandomPassword(length: number = 12): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let result = '';

    // Asegurar al menos un carácter de cada tipo
    result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    result += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    result += '0123456789'[Math.floor(Math.random() * 10)];
    result += '@$!%*?&'[Math.floor(Math.random() * 7)];

    // Completar el resto de la longitud
    for (let i = 4; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }

    // Mezclar caracteres
    return result
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
