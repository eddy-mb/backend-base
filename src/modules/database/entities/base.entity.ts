import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  Index,
} from 'typeorm';

/**
 * BaseEntity - Entidad base para auditoría y gestión de ciclo de vida
 *
 * Proporciona campos estándar para todas las entidades del sistema:
 * - ID autoincremental
 * - Timestamps de creación, modificación y eliminación
 * - Campos de auditoría (quién hizo qué)
 * - Estado del registro
 * - Soft deletes automático
 *
 * Uso en otras entidades:
 * @Entity('usuarios')
 * export class Usuario extends BaseEntity {
 *   @Column()
 *   nombre: string;
 *   // ... otros campos específicos
 * }
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({
    name: '_fecha_creacion',
    type: 'timestamp with time zone',
    comment: 'Fecha y hora de creación del registro',
  })
  @Index()
  fechaCreacion: Date;

  @UpdateDateColumn({
    name: '_fecha_modificacion',
    type: 'timestamp with time zone',
    comment: 'Fecha y hora de la última modificación',
  })
  fechaModificacion: Date;

  @DeleteDateColumn({
    name: '_fecha_eliminacion',
    type: 'timestamp with time zone',
    comment: 'Fecha y hora de eliminación lógica (soft delete)',
  })
  @Index()
  fechaEliminacion?: Date;

  @Column({
    name: '_usuario_creacion',
    nullable: true,
    comment: 'ID o email del usuario que creó el registro',
  })
  @Index()
  usuarioCreacion?: string;

  @Column({
    name: '_usuario_modificacion',
    nullable: true,
    comment: 'ID o email del usuario que modificó el registro',
  })
  usuarioModificacion?: string;

  @Column({
    name: '_usuario_eliminacion',
    nullable: true,
    comment: 'ID o email del usuario que eliminó el registro',
  })
  usuarioEliminacion?: string;

  @Column({
    name: '_estado',
    default: 'activo',
    comment: 'Estado del registro (activo, inactivo, pendiente, etc.)',
  })
  @Index()
  estado: string;

  /**
   * Verifica si el registro está activo
   */
  get isActivo(): boolean {
    return this.estado === 'activo' && !this.fechaEliminacion;
  }

  /**
   * Verifica si el registro fue eliminado (soft delete)
   */
  get isEliminado(): boolean {
    return !!this.fechaEliminacion;
  }

  /**
   * Marca el registro como eliminado por un usuario
   */
  marcarComoEliminado(usuario?: string): void {
    this.fechaEliminacion = new Date();
    this.usuarioEliminacion = usuario;
    this.estado = 'eliminado';
  }

  /**
   * Restaura un registro eliminado
   */
  restaurar(usuario?: string): void {
    this.fechaEliminacion = undefined;
    this.usuarioEliminacion = undefined;
    this.usuarioModificacion = usuario;
    this.estado = 'activo';
  }

  /**
   * Actualiza los campos de auditoría para modificación
   */
  actualizarAuditoria(usuario?: string): void {
    this.usuarioModificacion = usuario;
    this.fechaModificacion = new Date();
  }
}
