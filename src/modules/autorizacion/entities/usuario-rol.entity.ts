import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from './rol.entity';

/**
 * Entidad UsuarioRol - Relación many-to-many entre Usuario y Rol
 */
@Entity({ name: 'usuario_roles', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['usuarioId', 'rolId'], { unique: true })
@Index(['usuarioId'])
@Index(['rolId'])
export class UsuarioRol extends BaseEntity {
  @Column({
    name: 'usuario_id',
    type: 'bigint',
    comment: 'ID del usuario',
  })
  usuarioId: string;

  @Column({
    name: 'rol_id',
    type: 'bigint',
    comment: 'ID del rol',
  })
  rolId: string;

  @Column({
    name: 'fecha_expiracion',
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Fecha de expiración del rol asignado (opcional)',
  })
  fechaExpiracion?: Date | null;

  // ==================== RELACIONES ====================
  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: Usuario;

  @ManyToOne(() => Rol, (rol) => rol.usuarioRoles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol?: Rol;

  // ==================== MÉTODOS DE NEGOCIO ====================
  /**
   * Verifica si la asignación de rol está vigente
   */
  estaVigente(): boolean {
    return (
      this.isActive &&
      !this.fechaEliminacion &&
      (!this.fechaExpiracion || new Date() < this.fechaExpiracion)
    );
  }

  /**
   * Verifica si el rol está próximo a expirar (dentro de 7 días)
   */
  proximoAExpirar(): boolean {
    if (!this.fechaExpiracion) return false;

    const ahora = new Date();
    const diasRestantes = Math.ceil(
      (this.fechaExpiracion.getTime() - ahora.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return diasRestantes <= 7 && diasRestantes > 0;
  }
}
