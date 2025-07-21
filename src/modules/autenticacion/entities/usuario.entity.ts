import { Entity, Column } from 'typeorm';
import { EstadoUsuario } from '../enums/auth.enums';
import { BaseEntity } from '../../database/entities/base.entity';

@Entity({ name: 'usuarios', schema: process.env.DB_SCHEMA_USUARIOS })
export class Usuario extends BaseEntity {
  @Column({ name: 'email', type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'password', type: 'varchar', select: false })
  password: string;

  @Column({ name: 'nombre', type: 'varchar', nullable: true })
  nombre?: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoUsuario,
    default: EstadoUsuario.PENDIENTE_VERIFICACION,
  })
  estado: EstadoUsuario;

  @Column({ name: 'email_verificado_en', type: 'timestamp', nullable: true })
  emailVerificadoEn?: Date | null;

  @Column({ name: 'google_id', type: 'varchar', nullable: true })
  googleId?: string | null;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    nullable: true,
    select: false,
  })
  refreshToken?: string | null;

  @Column({ name: 'ultimo_login', type: 'timestamp', nullable: true })
  ultimoLogin?: Date | null;

  // Métodos de utilidad
  get estaVerificado(): boolean {
    return this.emailVerificadoEn !== null;
  }

  get puedeIniciarSesion(): boolean {
    return this.estado === EstadoUsuario.ACTIVO && this.estaVerificado;
  }

  get estaActivo(): boolean {
    return this.estado === EstadoUsuario.ACTIVO;
  }
}
