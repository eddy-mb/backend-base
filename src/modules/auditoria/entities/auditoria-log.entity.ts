import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  AccionAuditoria,
  AuditoriaMetadatos,
} from '../interfaces/auditoria.interface';
import { AUDITORIA_LIMITS } from '../constants/auditoria.constants';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Entidad para registrar logs de auditoría del sistema
 *
 * Registra automáticamente las operaciones críticas realizadas por usuarios,
 * proporcionando trazabilidad completa de acciones en el sistema.
 */

@Entity({ name: 'auditoria_logs', schema: process.env.DB_SCHEMA_SISTEMA })
@Index(['tabla', 'fechaCreacion']) // Índice compuesto para consultas frecuentes
@Index(['usuarioId', 'fechaCreacion']) // Índice para consultas por usuario
@Index(['accion', 'fechaCreacion']) // Índice para consultas por acción
@Index(['fechaCreacion']) // Índice para ordenamiento por fecha
export class AuditoriaLog {
  /**
   * Identificador único del log de auditoría
   */
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint' })
  id: string;

  /**
   * Fecha y hora exacta cuando se realizó la operación
   */
  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  /**
   * Nombre de la tabla/entidad afectada por la operación
   * Ejemplos: 'usuarios', 'archivos', 'configuracion_general'
   */
  @Column({
    name: 'tabla',
    type: 'varchar',
    length: AUDITORIA_LIMITS.TABLA_MAX_LENGTH,
    nullable: false,
  })
  tabla: string;

  /**
   * Identificador del registro específico que fue afectado
   * Puede ser un ID numérico, UUID, o cualquier identificador único
   */
  @Column({
    name: 'id_registro',
    type: 'varchar',
    length: AUDITORIA_LIMITS.ID_REGISTRO_MAX_LENGTH,
    nullable: false,
  })
  idRegistro: string;

  /**
   * Tipo de operación realizada
   * CREATE: Creación de nuevo registro
   * UPDATE: Modificación de registro existente
   * DELETE: Eliminación (lógica o física) de registro
   */
  @Column({
    name: 'accion',
    type: 'enum',
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    nullable: false,
  })
  accion: AccionAuditoria;

  /**
   * ID del usuario que realizó la operación
   * Puede ser null para operaciones del sistema o usuarios anónimos
   */
  @Column({
    name: 'usuario_id',
    type: 'bigint',
    nullable: true,
  })
  usuarioId?: string;

  /**
   * Metadatos adicionales de la operación en formato JSON
   * Incluye información como IP, user agent, parámetros de la operación, etc.
   *
   * Estructura esperada:
   * {
   *   request: { ip, userAgent, url, method, correlationId },
   *   usuario: { id, email, rol },
   *   sistema: { modulo, metodo, timestamp, duracion },
   *   operacion: { descripcion, parametros, resultado, mensaje },
   *   [key: string]: any // Metadatos personalizados
   * }
   */
  @Column({
    name: 'metadatos',
    type: 'jsonb',
    nullable: true,
    comment: 'Metadatos adicionales de la operación en formato JSON',
  })
  metadatos?: AuditoriaMetadatos;

  /**
   * Campo calculado para facilitar búsquedas por correlation ID
   * Se genera automáticamente desde los metadatos
   */
  @Column({
    name: 'correlation_id',
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: 'ID de correlación extraído de metadatos para búsquedas rápidas',
  })
  correlationId?: string;

  /**
   * Campo calculado para facilitar búsquedas por IP
   * Se genera automáticamente desde los metadatos
   */
  @Column({
    name: 'ip_origen',
    type: 'inet',
    nullable: true,
    comment: 'IP del cliente extraída de metadatos para búsquedas rápidas',
  })
  ipOrigen?: string;

  /**
   * Constructor para crear instancias de AuditoriaLog
   */
  constructor(partial?: Partial<AuditoriaLog>) {
    if (partial) {
      Object.assign(this, partial);

      // Extraer campos calculados de metadatos si están disponibles
      if (partial.metadatos) {
        this.correlationId = partial.metadatos.request?.correlationId;
        this.ipOrigen = partial.metadatos.request?.ip;
      }
    }
  }

  /**
   * Método helper para verificar si el log es de una acción específica
   */
  esAccion(accion: AccionAuditoria): boolean {
    return this.accion === accion;
  }

  /**
   * Método helper para verificar si el log pertenece a una tabla específica
   */
  esTabla(tabla: string): boolean {
    return this.tabla.toLowerCase() === tabla.toLowerCase();
  }

  /**
   * Método helper para obtener información del usuario desde metadatos
   */
  getUsuarioInfo(): { id?: number; email?: string; rol?: string } | null {
    return this.metadatos?.usuario || null;
  }

  /**
   * Método helper para obtener información del request desde metadatos
   */
  getRequestInfo(): {
    ip?: string;
    userAgent?: string;
    url?: string;
    method?: string;
  } | null {
    return this.metadatos?.request || null;
  }

  /**
   * Método helper para verificar si la operación fue exitosa
   */
  fueExitosa(): boolean {
    return this.metadatos?.operacion?.resultado === 'exito';
  }

  /**
   * Método para serializar metadatos de forma segura
   */
  toJSON() {
    return {
      id: this.id,
      fechaCreacion: this.fechaCreacion,
      tabla: this.tabla,
      idRegistro: this.idRegistro,
      accion: this.accion,
      usuarioId: this.usuarioId,
      correlationId: this.correlationId,
      ipOrigen: this.ipOrigen,
      metadatos: this.metadatos,
    };
  }
}
