import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import { EstadoUsuario } from '../enums/auth.enums';

@Injectable()
export class UsuarioRepository {
  private repository: Repository<Usuario>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(Usuario);
  }

  /**
   * Busca usuario por email (sin password)
   */
  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { email },
    });
  }

  /**
   * Busca usuario para autenticación (incluye password)
   */
  async buscarParaAuth(email: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'nombre',
        'estado',
        'emailVerificadoEn',
      ],
    });
  }

  /**
   * Busca usuario por ID para respuestas (sin datos sensibles)
   */
  async buscarParaRespuesta(id: number): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { id },
      select: ['id', 'email', 'nombre', 'estado', 'emailVerificadoEn'],
    });
  }

  /**
   * Busca usuario por Google ID
   */
  async buscarPorGoogleId(googleId: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { googleId },
    });
  }

  /**
   * Crea un nuevo usuario
   */
  async crear(datos: Partial<Usuario>): Promise<Usuario> {
    const usuario = this.repository.create(datos);
    return await this.repository.save(usuario);
  }

  /**
   * Actualiza un usuario
   */
  async actualizar(id: number, datos: Partial<Usuario>): Promise<void> {
    await this.repository.update(id, datos);
  }

  /**
   * Actualiza último login
   */
  async actualizarUltimoLogin(id: number): Promise<void> {
    await this.repository.update(id, {
      ultimoLogin: new Date(),
    });
  }

  /**
   * Actualiza refresh token
   */
  async actualizarRefreshToken(
    id: number,
    refreshToken: string | null,
  ): Promise<void> {
    await this.repository.update(id, { refreshToken });
  }

  /**
   * Verifica email del usuario
   */
  async verificarEmail(email: string): Promise<void> {
    await this.repository.update(
      { email },
      {
        emailVerificadoEn: new Date(),
        estado: EstadoUsuario.ACTIVO,
      },
    );
  }

  /**
   * Actualiza contraseña
   */
  async actualizarPassword(
    email: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.repository.update({ email }, { password: hashedPassword });
  }

  /**
   * Busca usuario por refresh token
   */
  async buscarPorRefreshToken(refreshToken: string): Promise<Usuario | null> {
    return this.repository.findOne({
      where: { refreshToken },
      select: ['id', 'email', 'refreshToken'],
    });
  }
}
