import { Injectable, Logger } from '@nestjs/common';
import { Queue, JobOptions, JobStatusClean } from 'bull';
import {
  EstadisticasCola,
  ConfiguracionBullDefecto,
} from '../interfaces/queue.interface';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private colas: Map<string, Queue> = new Map();

  /**
   * Configuración por defecto para trabajos Bull
   */
  static readonly CONFIGURACION_DEFECTO: ConfiguracionBullDefecto = {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  };

  /**
   * Registrar una cola para uso posterior
   */
  registrarCola(nombre: string, cola: Queue): void {
    this.colas.set(nombre, cola);
    this.logger.log(`Cola '${nombre}' registrada`);
  }

  /**
   * Obtener una cola registrada
   */
  obtenerCola(nombre: string): Queue | undefined {
    const cola = this.colas.get(nombre);
    if (!cola) {
      this.logger.warn(`Cola '${nombre}' no encontrada`);
    }
    return cola;
  }

  /**
   * Agregar trabajo a una cola
   */
  async agregarTrabajo(
    nombreCola: string,
    datos: any,
    opciones?: JobOptions,
  ): Promise<boolean> {
    try {
      const cola = this.obtenerCola(nombreCola);
      if (!cola) {
        throw new Error(`Cola '${nombreCola}' no encontrada`);
      }

      await cola.add(datos, opciones);
      this.logger.debug(`Trabajo agregado a cola '${nombreCola}'`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error agregando trabajo a cola '${nombreCola}':`,
        error,
      );
      return false;
    }
  }

  /**
   * Obtener estadísticas de una cola
   */
  async obtenerEstadisticasCola(
    nombreCola: string,
  ): Promise<EstadisticasCola | null> {
    try {
      const cola = this.obtenerCola(nombreCola);
      if (!cola) {
        return null;
      }

      const [activos, completados, fallidos, esperando] = await Promise.all([
        cola.getActive(),
        cola.getCompleted(),
        cola.getFailed(),
        cola.getWaiting(),
      ]);

      return {
        nombre: nombreCola,
        trabajosActivos: activos.length,
        trabajosCompletados: completados.length,
        trabajosFallidos: fallidos.length,
        trabajosEspera: esperando.length,
      };
    } catch (error) {
      this.logger.error(
        `Error obteniendo estadísticas de cola '${nombreCola}':`,
        error,
      );
      return null;
    }
  }

  /**
   * Obtener estadísticas de todas las colas registradas
   */
  async obtenerEstadisticasTodasColas(): Promise<EstadisticasCola[]> {
    const estadisticas: EstadisticasCola[] = [];

    for (const nombreCola of this.colas.keys()) {
      const estadistica = await this.obtenerEstadisticasCola(nombreCola);
      if (estadistica) {
        estadisticas.push(estadistica);
      }
    }

    return estadisticas;
  }

  /**
   * Pausar una cola
   */
  async pausarCola(nombreCola: string): Promise<boolean> {
    try {
      const cola = this.obtenerCola(nombreCola);
      if (!cola) {
        return false;
      }

      await cola.pause();
      this.logger.log(`Cola '${nombreCola}' pausada`);
      return true;
    } catch (error) {
      this.logger.error(`Error pausando cola '${nombreCola}':`, error);
      return false;
    }
  }

  /**
   * Reanudar una cola
   */
  async reanudarCola(nombreCola: string): Promise<boolean> {
    try {
      const cola = this.obtenerCola(nombreCola);
      if (!cola) {
        return false;
      }

      await cola.resume();
      this.logger.log(`Cola '${nombreCola}' reanudada`);
      return true;
    } catch (error) {
      this.logger.error(`Error reanudando cola '${nombreCola}':`, error);
      return false;
    }
  }

  /**
   * Limpiar trabajos completados/fallidos de una cola
   */
  async limpiarCola(
    nombreCola: string,
    tipo: JobStatusClean = 'completed',
  ): Promise<boolean> {
    try {
      const cola = this.obtenerCola(nombreCola);
      if (!cola) {
        return false;
      }

      await cola.clean(5000, tipo); // Limpiar trabajos de más de 5 segundos
      this.logger.log(`Cola '${nombreCola}' limpiada (tipo: ${tipo})`);
      return true;
    } catch (error) {
      this.logger.error(`Error limpiando cola '${nombreCola}':`, error);
      return false;
    }
  }

  /**
   * Obtener lista de colas registradas
   */
  obtenerNombresColas(): string[] {
    return Array.from(this.colas.keys());
  }

  /**
   * Verificar si una cola está registrada
   */
  colaExiste(nombreCola: string): boolean {
    return this.colas.has(nombreCola);
  }
}
