import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { UsuarioRol } from './usuario-rol.entity';

/**
 * Entidad Rol - Define roles del sistema para autorización RBAC
 */
@Entity({ name: 'roles', schema: process.env.DB_SCHEMA_USUARIOS })
@Index(['codigo'], { unique: true, where: '_fecha_eliminacion IS NULL' })
export class Rol extends BaseEntity {
  @Column({
    name: 'codigo',
    type: 'varchar',
    unique: true,
    length: 50,
    comment: 'Código único del rol (ADMINISTRADOR, USUARIO, INVITADO)',
  })
  @Index()
  codigo: string;

  @Column({
    name: 'nombre',
    type: 'varchar',
    length: 100,
    comment: 'Nombre descriptivo del rol',
  })
  nombre: string;

  @Column({
    name: 'descripcion',
    type: 'text',
    nullable: true,
    comment: 'Descripción detallada del rol y sus permisos',
  })
  descripcion?: string;

  @Column({
    name: 'es_sistema',
    type: 'boolean',
    default: false,
    comment: 'Indica si es un rol del sistema (no puede ser eliminado)',
  })
  @Index()
  esSistema: boolean;

  // ==================== RELACIONES ====================
  @OneToMany(() => UsuarioRol, (usuarioRol) => usuarioRol.rol)
  usuarioRoles?: UsuarioRol[];

  // ==================== MÉTODOS DE NEGOCIO ====================
  /**
   * Verifica si el rol puede ser eliminado
   */
  puedeSerEliminado(): boolean {
    return !this.esSistema && this.isActive && !this.fechaEliminacion;
  }

  /**
   * Verifica si es un rol administrativo
   */
  esAdministrativo(): boolean {
    return this.codigo === 'ADMINISTRADOR' || this.codigo === 'SUPER_ADMIN';
  }
}
