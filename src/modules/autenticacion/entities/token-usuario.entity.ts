import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { TipoToken } from '../enums/autenticacion.enum';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Entidad TokenUsuario - Gestión de tokens de autenticación
 * No extiende BaseEntity por simplicidad y performance
 */
@Entity({ name: 'tokens_usuario', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['usuarioId', 'tipo'], { where: 'revocado = false' })
@Index(['fechaExpiracion'], { where: 'revocado = false' })
export class TokenUsuario {
  @PrimaryGeneratedColumn()
  id: string;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'usuario_id', type: 'bigint' })
  @Index()
  usuarioId: string;

  @Column({
    type: 'enum',
    enum: TipoToken,
    comment:
      'Tipo de token: refresh, verificacion_email, recuperacion_password',
  })
  @Index()
  tipo: TipoToken;

  @Column({
    type: 'text',
    comment: 'Token hasheado o encriptado',
  })
  @Exclude({ toPlainOnly: true })
  token: string;

  @Column({
    name: 'fecha_expiracion',
    type: 'timestamp with time zone',
    comment: 'Fecha y hora de expiración del token',
  })
  @Index()
  fechaExpiracion: Date;

  @Column({
    name: 'info_dispositivo',
    type: 'text',
    nullable: true,
    comment: 'Información del dispositivo o navegador',
  })
  infoDispositivo?: string;

  @Column({
    name: 'direccion_ip',
    type: 'inet',
    nullable: true,
    comment: 'Dirección IP desde la cual se generó el token',
  })
  direccionIp?: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el token ha sido revocado manualmente',
  })
  @Index()
  revocado: boolean;

  // Relación con Usuario
  @ManyToOne(() => Usuario, (usuario) => usuario.tokens)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  // Métodos de negocio
  /**
   * Verifica si el token está expirado
   */
  estaExpirado(): boolean {
    return new Date() > this.fechaExpiracion;
  }

  /**
   * Verifica si el token es válido (no revocado ni expirado)
   */
  esValido(): boolean {
    return !this.revocado && !this.estaExpirado();
  }

  /**
   * Revocar el token
   */
  revocar(): void {
    this.revocado = true;
  }
}
