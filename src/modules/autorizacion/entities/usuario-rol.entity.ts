import { Entity, Column, JoinColumn, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Usuario } from '../../autenticacion/entities/usuario.entity';
import { Rol } from './rol.entity';
import { EstadoUsuarioRol } from '../enums/autorizacion.enums';

@Entity({ name: 'usuario_roles', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['usuarioId', 'rolId'], { unique: true })
@Index(['usuarioId', 'estado'])
export class UsuarioRol extends BaseEntity {
  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId: number;

  @Column({ name: 'rol_id', type: 'int' })
  rolId: number;

  @Column({
    name: 'fecha_asignacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaAsignacion: Date;

  @Column({ name: 'asignado_por', type: 'varchar', nullable: true })
  asignadoPor?: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoUsuarioRol,
    default: EstadoUsuarioRol.ACTIVO,
  })
  estado: EstadoUsuarioRol;

  // Relaciones
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Rol)
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  /**
   * Verifica si la asignación está activa
   */
  get activa(): boolean {
    return this.estado === EstadoUsuarioRol.ACTIVO && this.isActive;
  }

  /**
   * Activa la asignación
   */
  activar(usuario?: string): void {
    this.estado = EstadoUsuarioRol.ACTIVO;
    this.actualizarAuditoria(usuario);
  }

  /**
   * Desactiva la asignación
   */
  desactivar(usuario?: string): void {
    this.estado = EstadoUsuarioRol.INACTIVO;
    this.actualizarAuditoria(usuario);
  }
}
