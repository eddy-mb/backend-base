import { Injectable } from '@nestjs/common';
import { TokenVerificacionRepository } from '../repositories/token-verificacion.repository';
import { TipoToken } from '../enums/auth.enums';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { TokenValidationResult } from '../interfaces/auth.interfaces';

@Injectable()
export class TokenService {
  constructor(
    private tokenVerificacionRepository: TokenVerificacionRepository,
  ) {}

  /**
   * Crea token de verificación de email
   */
  async crearTokenVerificacion(email: string): Promise<string> {
    // Invalidar tokens anteriores
    await this.tokenVerificacionRepository.invalidarTokensAnteriores(
      email,
      TipoToken.VERIFICACION_EMAIL,
    );

    // Crear nuevo token (expira en 24 horas)
    const expiraEn = new Date();
    expiraEn.setHours(
      expiraEn.getHours() + AUTH_CONSTANTS.TOKEN_EXPIRY.EMAIL_VERIFICATION,
    );

    const token = await this.tokenVerificacionRepository.crearToken({
      email,
      tipo: TipoToken.VERIFICACION_EMAIL,
      expiraEn,
    });

    return token.token;
  }

  /**
   * Crea token de reset de contraseña
   */
  async crearTokenReset(email: string): Promise<string> {
    // Invalidar tokens anteriores
    await this.tokenVerificacionRepository.invalidarTokensAnteriores(
      email,
      TipoToken.RESET_PASSWORD,
    );

    // Crear nuevo token (expira en 1 hora)
    const expiraEn = new Date();
    expiraEn.setHours(
      expiraEn.getHours() + AUTH_CONSTANTS.TOKEN_EXPIRY.PASSWORD_RESET,
    );

    const token = await this.tokenVerificacionRepository.crearToken({
      email,
      tipo: TipoToken.RESET_PASSWORD,
      expiraEn,
    });

    return token.token;
  }

  /**
   * Valida token de verificación
   */
  async validarToken(
    token: string,
    tipo: TipoToken,
  ): Promise<TokenValidationResult> {
    const tokenVerificacion =
      await this.tokenVerificacionRepository.buscarToken(token);

    if (!tokenVerificacion) {
      return { email: '', valido: false };
    }

    if (tokenVerificacion.tipo !== tipo) {
      return { email: '', valido: false };
    }

    if (tokenVerificacion.usado || tokenVerificacion.estaExpirado()) {
      return { email: '', valido: false };
    }

    return {
      email: tokenVerificacion.email,
      valido: true,
    };
  }

  /**
   * Marca token como usado
   */
  async marcarTokenComoUsado(token: string): Promise<void> {
    const tokenVerificacion =
      await this.tokenVerificacionRepository.buscarToken(token);
    if (tokenVerificacion) {
      await this.tokenVerificacionRepository.marcarComoUsado(
        tokenVerificacion.id,
      );
    }
  }

  /**
   * Limpia tokens expirados (tarea programada)
   */
  async limpiarTokensExpirados(): Promise<void> {
    await this.tokenVerificacionRepository.limpiarTokensExpirados();
  }
}
