/**
 * Interfaces para el sistema de auditoría
 */

export interface AuditoriaConfig {
  includeOldValues?: boolean;
  includeNewValues?: boolean;
  skipFields?: string[];
  tableName?: string;
  customMetadata?: Record<string, any>;
}

export interface AuditoriaMetadata {
  userId?: number;
  ip?: string;
  userAgent?: string;
  correlationId?: string | string[];
  timestamp: Date;
  origen?: string; // 'http', 'cron', 'import', 'manual', etc.
  isSystemGenerated?: boolean; // true para procesos automáticos sin usuario
  [key: string]: any;
}

export interface AuditoriaEntry {
  tabla: string;
  idRegistro: string;
  accion: AuditoriaAction;
  valoresAnteriores?: unknown;
  valoresNuevos?: unknown;
  usuarioId?: number;
  metadatos?: AuditoriaMetadata;
}

export interface AuditoriaQuery {
  tabla?: string;
  idRegistro?: string;
  accion?: AuditoriaAction;
  usuarioId?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  limite?: number;
  offset?: number;
}

export interface AuditoriaStats {
  totalRegistros: number;
  registrosPorAccion: Record<AuditoriaAction, number>;
  registrosPorTabla: Record<string, number>;
  usuariosActivos: number;
}

export enum AuditoriaAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ', // Opcional para operaciones sensibles
}
