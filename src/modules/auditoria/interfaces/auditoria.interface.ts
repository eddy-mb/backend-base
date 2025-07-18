/**
 * Interfaces para tipos internos del módulo de auditoría
 * Solo incluye tipos que NO son DTOs HTTP
 */

/**
 * Acciones auditables en el sistema
 */
export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Opciones para configurar la auditoría de un método
 */
export interface AuditableOptions {
  tabla?: string;
  descripcion?: string;
  accion?: AccionAuditoria;
  incluirMetadatos?: boolean;
}

/**
 * Contexto de auditoría extraído del request
 */
export interface AuditoriaContexto {
  usuarioId?: number;
  ip?: string;
  userAgent?: string;
  correlationId: string;
  modulo?: string;
  metodo?: string;
  url?: string;
  httpMethod?: string;
}

/**
 * Metadatos adicionales para el log de auditoría
 */
export interface AuditoriaMetadatos {
  request?: {
    ip?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    correlationId?: string;
  };

  usuario?: {
    id?: number;
    email?: string;
    rol?: string;
  };

  sistema?: {
    modulo?: string;
    metodo?: string;
    timestamp?: Date;
    duracion?: number;
  };

  operacion?: {
    descripcion?: string;
    parametros?: any;
    resultado?: 'exito' | 'error';
    mensaje?: string;
  };

  [key: string]: any;
}

/**
 * Estadísticas de auditoría
 */
export interface AuditoriaEstadisticas {
  totalOperaciones: number;
  operacionesPorAccion: Record<AccionAuditoria, number>;
  operacionesPorTabla: Record<string, number>;
  usuariosActivos: number;
  rangoFechas: {
    inicio: Date;
    fin: Date;
  };
}
