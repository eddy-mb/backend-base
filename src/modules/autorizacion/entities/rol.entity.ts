import { Entity, Column, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { EstadoRol } from '../enums/autorizacion.enums';

@Entity({ name: 'roles', schema: process.env.DB_SCHEMA_USUARIOS })
@Unique(['codigo'])
@Index(['estado', 'isActive'])
export class Rol extends BaseEntity {
  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  nombre: string;

  @Column({ name: 'codigo', type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion?: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoRol,
    default: EstadoRol.ACTIVO,
  })
  estado: EstadoRol;

  /**
   * Verifica si el rol está activo y disponible
   */
  get disponible(): boolean {
    return this.estado === EstadoRol.ACTIVO && this.isActive;
  }

  /**
   * Activa el rol
   */
  activar(usuario?: string): void {
    this.estado = EstadoRol.ACTIVO;
    this.actualizarAuditoria(usuario);
  }

  /**
   * Desactiva el rol
   */
  desactivar(usuario?: string): void {
    this.estado = EstadoRol.INACTIVO;
    this.actualizarAuditoria(usuario);
  }
}
