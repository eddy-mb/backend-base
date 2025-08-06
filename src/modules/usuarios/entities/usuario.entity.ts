import { Entity, Column, OneToOne, OneToMany, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../database/entities/base.entity';
import { PerfilUsuario } from './perfil-usuario.entity';
import { LOGIN_CONFIG } from '../constants/usuarios.constants';
import { EstadoUsuario } from '../enums/usuario.enum';
import { TokenUsuario } from '../../autenticacion/entities/token-usuario.entity';

/**
 * Entidad Usuario - Core del sistema de identidad y perfil
 * Extiende BaseEntity para auditoría automática
 */
@Entity({ name: 'usuarios', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['email'], { unique: true, where: '_fecha_eliminacion IS NULL' })
export class Usuario extends BaseEntity {
  // ==================== DATOS DE IDENTIDAD ====================
  @Column({
    name: 'email',
    type: 'varchar',
    unique: true,
    length: 255,
    comment: 'Email único del usuario para autenticación',
  })
  @Index()
  email: string;

  @Column({
    name: 'password',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Hash de la contraseña del usuario - NULL para usuarios OAuth',
  })
  @Exclude({ toPlainOnly: true })
  password: string | null;

  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 100,
    comment: 'Nombre del usuario',
  })
  nombre: string;

  // ==================== ESTADO Y VERIFICACIÓN ====================
  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoUsuario,
    default: EstadoUsuario.PENDIENTE_VERIFICACION,
    comment: 'Estado actual del usuario',
  })
  @Index()
  estado: EstadoUsuario;

  @Column({
    name: 'email_verificado',
    type: 'boolean',
    default: false,
    comment: 'Indica si el email del usuario ha sido verificado',
  })
  @Index()
  emailVerificado: boolean;

  @Column({
    name: 'fecha_verificacion',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha y hora de verificación del email',
  })
  fechaVerificacion?: Date;

  // ==================== METADATOS DE SEGURIDAD ====================
  @Column({
    name: 'fecha_ultimo_login',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha y hora del último login exitoso',
  })
  fechaUltimoLogin?: Date;

  @Column({
    name: 'intentos_login',
    type: 'int',
    default: 0,
    comment: 'Número de intentos de login fallidos consecutivos',
  })
  intentosLogin: number;

  @Column({
    name: 'ultima_actividad',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha y hora de la última actividad del usuario',
  })
  ultimaActividad?: Date;

  @Column({
    name: 'ip_registro',
    type: 'inet',
    nullable: true,
    comment: 'Dirección IP desde la cual se registró el usuario',
  })
  ipRegistro?: string;

  @Column({
    name: 'user_agent_registro',
    type: 'text',
    nullable: true,
    comment: 'User Agent del navegador usado en el registro',
  })
  userAgentRegistro?: string;

  // ==================== OAUTH PROVIDERS ====================
  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID único del usuario en Google OAuth',
  })
  @Index({ where: 'google_id IS NOT NULL' })
  googleId?: string;

  @Column({
    name: 'oauth_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Proveedor OAuth utilizado (google, facebook, etc.)',
  })
  @Index({ where: 'oauth_provider IS NOT NULL' })
  oauthProvider?: string;

  // ==================== RELACIONES ====================
  @OneToOne(() => PerfilUsuario, (perfil) => perfil.usuario, {
    cascade: true,
    eager: false,
  })
  perfil?: PerfilUsuario;

  @OneToMany(() => TokenUsuario, (token) => token.usuario)
  tokens?: TokenUsuario[];

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
   * Verifica si el usuario usa OAuth exclusivamente
   */
  esUsuarioOAuth(): boolean {
    return this.password === null && !!this.oauthProvider;
  }

  /**
   * Verifica si puede hacer login con contraseña
   */
  puedeLoginConPassword(): boolean {
    return this.password !== null;
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
    // tokenVerificacion ahora se maneja en TokenUsuario
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
