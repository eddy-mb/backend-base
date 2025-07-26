import { Entity, Column, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../database/entities/base.entity';
import { AccionHttp, AplicacionTipo } from '../enums/autorizacion.enums';

@Entity({ name: 'politicas', schema: process.env.DB_SCHEMA_USUARIOS })
@Unique(['rol', 'recurso', 'accion', 'aplicacion'])
@Index(['rol', 'recurso'])
@Index(['isActive', 'fechaEliminacion'])
export class Politica extends BaseEntity {
  @Column({ name: 'rol', type: 'varchar', length: 50 })
  rol: string;

  @Column({ name: 'recurso', type: 'varchar', length: 255 })
  recurso: string;

  @Column({
    name: 'accion',
    type: 'enum',
    enum: AccionHttp,
  })
  accion: AccionHttp;

  @Column({
    name: 'aplicacion',
    type: 'enum',
    enum: AplicacionTipo,
    default: AplicacionTipo.BACKEND,
  })
  aplicacion: AplicacionTipo;

  /**
   * Verifica si el recurso es un wildcard
   */
  get esWildcard(): boolean {
    return this.recurso.endsWith('/*');
  }

  /**
   * Obtiene el patrón base para wildcards
   */
  get patronBase(): string {
    return this.esWildcard ? this.recurso.slice(0, -2) : this.recurso;
  }

  /**
   * Verifica si una URL coincide con este patrón
   */
  coincideConUrl(url: string): boolean {
    if (!this.esWildcard) {
      return this.recurso === url;
    }
    return url.startsWith(this.patronBase);
  }

  /**
   * Crea la clave de cache para esta política
   */
  get claveCache(): string {
    return `${this.rol}:${this.recurso}:${this.accion}:${this.aplicacion}`;
  }
}
