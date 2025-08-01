import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { ConfiguracionUsuario } from '../interfaces/usuario.interface';

/**
 * Entidad PerfilUsuario - Información personal extendida del usuario
 *
 * NO extiende BaseEntity porque:
 * - Es dependiente de Usuario (relación 1:1 obligatoria)
 * - La auditoría se maneja a nivel de Usuario
 * - onDelete CASCADE elimina automáticamente con Usuario
 * - Reduce redundancia y mejora performance
 */
@Entity({ name: 'perfiles_usuario', schema: process.env.DB_SCHEMA_USUARIOS })
export class PerfilUsuario {
  // ==================== CAMPOS BÁSICOS ====================
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Fecha de creación del perfil',
  })
  fechaCreacion: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    comment: 'Fecha de última modificación del perfil',
  })
  fechaModificacion: Date;

  // ==================== RELACIÓN CON USUARIO ====================
  @OneToOne(() => Usuario, (usuario) => usuario.perfil, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({
    name: 'usuario_id',
    type: 'bigint',
    comment: 'ID del usuario al que pertenece este perfil',
  })
  usuarioId: string;

  // ==================== INFORMACIÓN PERSONAL ====================
  @Column({
    length: 100,
    nullable: true,
    comment: 'Apellidos del usuario',
  })
  apellidos?: string;

  @Column({
    length: 20,
    nullable: true,
    comment: 'Número de teléfono del usuario',
  })
  telefono?: string;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Fecha de nacimiento del usuario',
  })
  fechaNacimiento?: Date | null;

  // ==================== PERFIL Y PERSONALIZACIÓN ====================
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nombre del archivo de avatar del usuario',
  })
  avatar?: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Biografía o descripción personal del usuario',
  })
  biografia?: string;

  @Column({
    type: 'jsonb',
    default: () => `'{
      "notificacionesEmail": true,
      "notificacionesWeb": true,
      "temaOscuro": false,
      "mostrarAvatar": true,
      "perfilPublico": false,
      "configuracionPrivacidad": {
        "mostrarEmail": false,
        "mostrarTelefono": false,
        "mostrarFechaNacimiento": false
      }
    }'`,
    comment: 'Configuraciones personalizadas del usuario',
  })
  configuraciones: ConfiguracionUsuario;

  // ==================== LOCALIZACIÓN Y PREFERENCIAS ====================
  @Column({
    default: 'America/La_Paz',
    length: 50,
    comment: 'Zona horaria preferida del usuario',
  })
  zonaHoraria: string;

  @Column({
    default: 'es',
    length: 5,
    comment: 'Idioma preferido del usuario (código ISO)',
  })
  idioma: string;

  // ==================== MÉTODOS DE NEGOCIO ====================
  /**
   * Obtiene el nombre completo del usuario
   */
  get nombreCompleto(): string {
    if (this.apellidos) {
      return `${this.usuario?.nombre || ''} ${this.apellidos}`.trim();
    }
    return this.usuario?.nombre || '';
  }

  /**
   * Verifica si el perfil tiene avatar
   */
  tieneAvatar(): boolean {
    return !!this.avatar;
  }

  /**
   * Actualiza configuraciones específicas
   */
  actualizarConfiguracion(
    nuevaConfiguracion: Partial<ConfiguracionUsuario>,
  ): void {
    this.configuraciones = {
      ...this.configuraciones,
      ...nuevaConfiguracion,
    };
  }

  /**
   * Verifica si el perfil está completo (datos básicos)
   */
  estaCompleto(): boolean {
    return !!(
      this.usuario?.nombre &&
      this.apellidos &&
      this.telefono &&
      this.fechaNacimiento
    );
  }
}
