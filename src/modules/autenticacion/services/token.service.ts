import { Injectable } from '@nestjs/common';
import { TokenUsuarioRepository } from '../repositories/token-usuario.repository';
import { TokenUsuario } from '../entities/token-usuario.entity';
import { LoggerService } from '../../logging/services/logger.service';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { TipoToken } from '../enums/autenticacion.enum';

@Injectable()
export class TokenService {
  constructor(
    private readonly tokenRepository: TokenUsuarioRepository,
    private readonly logger: LoggerService,
    private readonly dataSource: DataSource,
  ) {}

  // ==================== CRUD TOKENS ====================

  async crearToken(
    usuarioId: string,
    tipo: TipoToken,
    token: string,
    expiresInMs: number,
    infoDispositivo?: string,
    direccionIp?: string,
  ): Promise<TokenUsuario> {
    const fechaExpiracion = new Date(Date.now() + expiresInMs);

    return this.tokenRepository.crear({
      usuarioId,
      tipo,
      token: this.hashToken(token),
      fechaExpiracion,
      infoDispositivo,
      direccionIp,
    });
  }

  async validarToken(
    token: string,
    tipo: TipoToken,
  ): Promise<TokenUsuario | null> {
    const tokenHashed = this.hashToken(token);
    const tokenEntity = await this.tokenRepository.buscarPorToken(
      tokenHashed,
      tipo,
    );

    if (!tokenEntity || !tokenEntity.esValido()) {
      return null;
    }

    return tokenEntity;
  }

  async revocarToken(tokenId: string): Promise<void> {
    await this.tokenRepository.revocar(tokenId);
    this.logger.log(`Token revocado: ${tokenId}`, 'TokenService');
  }

  async revocarTodosPorUsuario(
    usuarioId: string,
    tipo?: TipoToken,
  ): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      await this.tokenRepository.revocarTodosPorUsuario(
        usuarioId,
        tipo,
        manager,
      );
      this.logger.log(
        `Tokens revocados para usuario: ${usuarioId} ${tipo ? `tipo: ${tipo}` : ''}`,
        'TokenService',
      );
    });
  }

  // ==================== MANTENIMIENTO ====================

  async limpiarTokensExpirados(): Promise<number> {
    const tokensEliminados = await this.tokenRepository.limpiarExpirados();
    if (tokensEliminados > 0) {
      this.logger.log(
        `Tokens expirados eliminados: ${tokensEliminados}`,
        'TokenService',
      );
    }
    return tokensEliminados;
  }

  async limpiarTokensRevocados(diasAntiguedad = 30): Promise<number> {
    const tokensEliminados =
      await this.tokenRepository.limpiarRevocados(diasAntiguedad);
    if (tokensEliminados > 0) {
      this.logger.log(
        `Tokens revocados antiguos eliminados: ${tokensEliminados}`,
        'TokenService',
      );
    }
    return tokensEliminados;
  }

  // ==================== UTILIDADES ====================

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // ==================== CONSULTAS ESPECÍFICAS ====================

  async obtenerUltimoRefreshToken(
    usuarioId: string,
  ): Promise<TokenUsuario | null> {
    return this.tokenRepository.obtenerUltimoRefreshToken(usuarioId);
  }

  async contarTokensActivos(usuarioId: string): Promise<number> {
    return this.tokenRepository.contarTokensActivosPorUsuario(usuarioId);
  }
}
