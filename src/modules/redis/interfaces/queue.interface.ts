import { JobOptions } from 'bull';

/**
 * Interfaces para colas de trabajo
 */

// Interfaces para casos de uso específicos (no usadas en infraestructura base)
export interface ConfiguracionCola {
  name: string;
  options?: JobOptions;
}

export interface TrabajoBase {
  id?: string;
  data: any;
  options?: JobOptions;
}

// Interfaces usadas en la infraestructura base
export interface EstadisticasCola {
  nombre: string;
  trabajosActivos: number;
  trabajosCompletados: number;
  trabajosFallidos: number;
  trabajosEspera: number;
}

export interface ConfiguracionBullDefecto {
  removeOnComplete: number;
  removeOnFail: number;
  attempts: number;
  backoff: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}
