import { Injectable } from '@nestjs/common';
import { DataSource, Repository, LessThan, MoreThan } from 'typeorm';
import { TokenVerificacion } from '../entities/token-verificacion.entity';
import { TipoToken } from '../enums/auth.enums';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenVerificacionRepository {
  private repository: Repository<TokenVerificacion>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(TokenVerificacion);
  }

  /**
   * Busca token válido (no usado y no expirado)
   */
  async buscarTokenValido(
    token: string,
    tipo: TipoToken,
  ): Promise<TokenVerificacion | null> {
    return this.repository.findOne({
      where: {
        token,
        tipo,
        usado: false,
        expiraEn: MoreThan(new Date()), // Corregido: debe ser MoreThan para tokens válidos
      },
    });
  }

  /**
   * Marca token como usado
   */
  async marcarComoUsado(id: number): Promise<void> {
    await this.repository.update(id, { usado: true });
  }

  /**
   * Limpia tokens expirados
   */
  async limpiarTokensExpirados(): Promise<void> {
    await this.repository.delete({
      expiraEn: LessThan(new Date()),
    });
  }

  /**
   * Crea nuevo token de verificación
   */
  async crearToken(datos: {
    email: string;
    tipo: TipoToken;
    expiraEn: Date;
  }): Promise<TokenVerificacion> {
    const token = this.generarToken();

    const tokenVerificacion = this.repository.create({
      token,
      email: datos.email,
      tipo: datos.tipo,
      expiraEn: datos.expiraEn,
    });

    return this.repository.save(tokenVerificacion);
  }

  /**
   * Invalida todos los tokens de un email y tipo
   */
  async invalidarTokensAnteriores(
    email: string,
    tipo: TipoToken,
  ): Promise<void> {
    await this.repository.update(
      { email, tipo, usado: false },
      { usado: true },
    );
  }

  /**
   * Busca token específico
   */
  async buscarToken(token: string): Promise<TokenVerificacion | null> {
    return this.repository.findOne({
      where: { token },
    });
  }

  /**
   * Genera token seguro
   */
  private generarToken(): string {
    return randomBytes(32).toString('hex');
  }
}
