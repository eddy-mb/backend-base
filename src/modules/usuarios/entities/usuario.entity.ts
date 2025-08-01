import { Entity, Column, OneToOne, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../database/entities/base.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { LOGIN_CONFIG } from '../constants/usuarios.constants';
import { EstadoUsuario } from '../enums/usuario.enum';

/**
 * Entidad Usuario - Core del sistema de autenticación y seguridad
 * Extiende BaseEntity para auditoría automática
 */
@Entity({ name: 'usuarios', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['email'], { unique: true, where: '_fecha_eliminacion IS NULL' })
export class Usuario extends BaseEntity {
  // ==================== DATOS DE AUTENTICACIÓN ====================
  @Column({
    unique: true,
    length: 255,
    comment: 'Email único del usuario para autenticación',
  })
  @Index()
  email: string;

  @Column({
    length: 255,
    comment: 'Hash de la contraseña del usuario',
  })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    length: 100,
    comment: 'Nombre del usuario',
  })
  nombre: string;

  // ==================== ESTADO Y VERIFICACIÓN ====================
  @Column({
    type: 'enum',
    enum: EstadoUsuario,
    default: EstadoUsuario.PENDIENTE_VERIFICACION,
    comment: 'Estado actual del usuario',
  })
  @Index()
  estado: EstadoUsuario;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el email del usuario ha sido verificado',
  })
  @Index()
  emailVerificado: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha y hora de verificación del email',
  })
  fechaVerificacion?: Date;

  // ==================== TOKENS DE SEGURIDAD ====================
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Refresh token para renovación de JWT',
  })
  @Exclude({ toPlainOnly: true })
  refreshToken?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token temporal para verificación de email',
  })
  @Exclude({ toPlainOnly: true })
  tokenVerificacion?: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token temporal para recuperación de contraseña',
  })
  @Exclude({ toPlainOnly: true })
  tokenRecuperacion?: string | null;

  // ==================== METADATOS DE SEGURIDAD ====================
  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha y hora del último login exitoso',
  })
  fechaUltimoLogin?: Date;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de intentos de login fallidos consecutivos',
  })
  intentosLogin: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha y hora de la última actividad del usuario',
  })
  ultimaActividad?: Date;

  @Column({
    type: 'inet',
    nullable: true,
    comment: 'Dirección IP desde la cual se registró el usuario',
  })
  ipRegistro?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'User Agent del navegador usado en el registro',
  })
  userAgentRegistro?: string;

  // ==================== RELACIONES ====================
  @OneToOne(() => PerfilUsuario, (perfil) => perfil.usuario, {
    cascade: true,
    eager: false,
  })
  perfil?: PerfilUsuario;

  // ==================== MÉTODOS DE NEGOCIO ====================
  /**
   * Verifica si el usuario puede iniciar sesión
   */
  puedeIniciarSesion(): boolean {
    return (
      this.estado === EstadoUsuario.ACTIVO &&
      this.emailVerificado &&
      this.isActive &&
      !this.fechaEliminacion
    );
  }

  /**
   * Verifica si el usuario está bloqueado por intentos de login
   */
  estaBloqueadoPorIntentos(): boolean {
    return this.intentosLogin >= LOGIN_CONFIG.MAX_INTENTOS;
  }

  /**
   * Verifica transición de estado válida
   */
  puedeTransicionarA(nuevoEstado: EstadoUsuario): boolean {
    const transicionesValidas: Record<EstadoUsuario, EstadoUsuario[]> = {
      [EstadoUsuario.PENDIENTE_VERIFICACION]: [EstadoUsuario.ACTIVO],
      [EstadoUsuario.ACTIVO]: [
        EstadoUsuario.INACTIVO,
        EstadoUsuario.SUSPENDIDO,
      ],
      [EstadoUsuario.INACTIVO]: [EstadoUsuario.ACTIVO],
      [EstadoUsuario.SUSPENDIDO]: [EstadoUsuario.ACTIVO],
    };

    return transicionesValidas[this.estado]?.includes(nuevoEstado) || false;
  }

  /**
   * Actualizar último login
   */
  actualizarUltimoLogin(): void {
    this.fechaUltimoLogin = new Date();
    this.ultimaActividad = new Date();
    this.intentosLogin = 0;
  }

  /**
   * Incrementar intentos de login fallidos
   */
  incrementarIntentosLogin(): void {
    this.intentosLogin += 1;
  }

  /**
   * Verificar email del usuario
   */
  verificarEmail(usuario?: string): void {
    this.emailVerificado = true;
    this.fechaVerificacion = new Date();
    this.estado = EstadoUsuario.ACTIVO;
    this.tokenVerificacion = null;
    this.actualizarAuditoria(usuario);
  }

  /**
   * Cambiar estado del usuario
   */
  cambiarEstado(nuevoEstado: EstadoUsuario, usuario?: string): void {
    if (!this.puedeTransicionarA(nuevoEstado)) {
      throw new Error(
        `Transición de estado inválida: ${this.estado} -> ${nuevoEstado}`,
      );
    }
    this.estado = nuevoEstado;
    this.actualizarAuditoria(usuario);
  }
}
