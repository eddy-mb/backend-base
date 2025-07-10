import { AuditoriaLog } from '@prisma/client';
import { AUDIT_SENSITIVE_FIELDS } from '../constants/auditoria-actions.constants';
import { JsonValue } from '@prisma/client/runtime/library';

/**
 * Utilidades para manejo de logs de auditoría
 * Funciones puras que operan sobre tipos de Prisma
 */
export class AuditoriaUtils {
  /**
   * Verifica si un log contiene datos sensibles
   */
  static containsSensitiveData(log: AuditoriaLog): boolean {
    const checkObject = (obj: JsonValue): boolean => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
      // Aquí obj es objeto plano no nulo y no array
      return Object.keys(obj).some((key) =>
        AUDIT_SENSITIVE_FIELDS.some((field) =>
          key.toLowerCase().includes(field),
        ),
      );
    };

    return checkObject(log.valoresAnteriores) || checkObject(log.valoresNuevos);
  }

  /**
   * Sanitiza datos sensibles de un log de auditoría
   */
  static sanitize(log: AuditoriaLog): AuditoriaLog {
    const sanitized = { ...log };

    if (
      sanitized.valoresAnteriores &&
      typeof sanitized.valoresAnteriores === 'object' &&
      !Array.isArray(sanitized.valoresAnteriores)
    ) {
      sanitized.valoresAnteriores = this.sanitizeObject(
        sanitized.valoresAnteriores,
      );
    }

    if (
      sanitized.valoresNuevos &&
      typeof sanitized.valoresNuevos === 'object' &&
      !Array.isArray(sanitized.valoresNuevos)
    ) {
      sanitized.valoresNuevos = this.sanitizeObject(sanitized.valoresNuevos);
    }

    return sanitized;
  }

  /**
   * Sanitiza un objeto removiendo campos sensibles
   */
  static sanitizeObject(obj: unknown): object {
    if (!obj || typeof obj !== 'object') return {};

    const sanitized: Record<string, unknown> = { ...obj };

    Object.keys(sanitized).forEach((key) => {
      if (
        AUDIT_SENSITIVE_FIELDS.some((field) =>
          key.toLowerCase().includes(field),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitiza una lista de logs de auditoría
   */
  static sanitizeList(logs: AuditoriaLog[]): AuditoriaLog[] {
    return logs.map((log) => this.sanitize(log));
  }

  /**
   * Filtra logs que contienen datos sensibles
   */
  static filterSensitive(logs: AuditoriaLog[]): AuditoriaLog[] {
    return logs.filter((log) => !this.containsSensitiveData(log));
  }

  /**
   * Extrae metadatos comunes de un log
   */
  static extractMetadata(log: AuditoriaLog): {
    hasOldValues: boolean;
    hasNewValues: boolean;
    hasSensitiveData: boolean;
    fieldCount: number;
  } {
    return {
      hasOldValues:
        !!log.valoresAnteriores &&
        Object.keys(log.valoresAnteriores).length > 0,
      hasNewValues:
        !!log.valoresNuevos && Object.keys(log.valoresNuevos).length > 0,
      hasSensitiveData: this.containsSensitiveData(log),
      fieldCount: [
        ...(log.valoresAnteriores ? Object.keys(log.valoresAnteriores) : []),
        ...(log.valoresNuevos ? Object.keys(log.valoresNuevos) : []),
      ].filter((field, index, arr) => arr.indexOf(field) === index).length,
    };
  }
}
