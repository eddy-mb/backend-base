import { Injectable } from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { QueueService } from '../services/queue.service';

/**
 * Ejemplo de implementación de cola de emails
 * Este archivo es solo un ejemplo y no se debe incluir en la infraestructura base
 */

// Tipos para el trabajo de email
interface EmailJobData {
  destinatario: string;
  asunto: string;
  contenido: string;
  prioridad?: 'alta' | 'normal' | 'baja';
}

@Injectable()
export class EmailService {
  constructor(
    private queueService: QueueService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    // Registrar la cola en el QueueService
    this.queueService.registrarCola('email', this.emailQueue);
  }

  /**
   * Agregar email a la cola
   */
  async enviarEmail(data: EmailJobData): Promise<boolean> {
    const opciones = {
      priority: this.getPrioridad(data.prioridad),
      delay: data.prioridad === 'baja' ? 5000 : 0, // Delay para emails de baja prioridad
      attempts: 3,
      backoff: {
        type: 'exponential' as const,
        delay: 2000,
      },
    };

    return this.queueService.agregarTrabajo('email', data, opciones);
  }

  /**
   * Enviar email urgente (alta prioridad)
   */
  async enviarEmailUrgente(
    data: Omit<EmailJobData, 'prioridad'>,
  ): Promise<boolean> {
    return this.enviarEmail({ ...data, prioridad: 'alta' });
  }

  /**
   * Programar email para envío posterior
   */
  async programarEmail(data: EmailJobData, delay: number): Promise<boolean> {
    const opciones = {
      delay,
      priority: this.getPrioridad(data.prioridad),
    };

    return this.queueService.agregarTrabajo('email', data, opciones);
  }

  /**
   * Obtener estadísticas de la cola de emails
   */
  async obtenerEstadisticas() {
    return this.queueService.obtenerEstadisticasCola('email');
  }

  /**
   * Pausar procesamiento de emails
   */
  async pausarProcesamiento(): Promise<boolean> {
    return this.queueService.pausarCola('email');
  }

  /**
   * Reanudar procesamiento de emails
   */
  async reanudarProcesamiento(): Promise<boolean> {
    return this.queueService.reanudarCola('email');
  }

  /**
   * Limpiar emails completados
   */
  async limpiarEmailsCompletados(): Promise<boolean> {
    return this.queueService.limpiarCola('email', 'completed');
  }

  private getPrioridad(prioridad?: 'alta' | 'normal' | 'baja'): number {
    switch (prioridad) {
      case 'alta':
        return 10;
      case 'baja':
        return 1;
      default:
        return 5;
    }
  }
}

/**
 * Procesador de la cola de emails
 */
@Processor('email')
export class EmailProcessor {
  /**
   * Procesar trabajo de email
   */
  @Process()
  async handleEmail(job: Job<EmailJobData>) {
    const { destinatario, asunto, contenido } = job.data;

    try {
      // Simular envío de email
      console.log(`Enviando email a: ${destinatario}`);
      console.log(`Asunto: ${asunto}`);
      console.log(`Contenido: ${contenido}`);

      // Aquí iría la lógica real de envío de email
      // await this.emailProvider.send(destinatario, asunto, contenido);

      // Simular tiempo de procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`Email enviado exitosamente a: ${destinatario}`);
    } catch (error) {
      console.error(`Error enviando email a ${destinatario}:`, error);
      throw error; // Esto activará el retry automático
    }
  }

  /**
   * Procesar emails de alta prioridad
   */
  @Process('alta-prioridad')
  async handleEmailAltaPrioridad(job: Job<EmailJobData>) {
    console.log(
      `Procesando email de alta prioridad para: ${job.data.destinatario}`,
    );
    return this.handleEmail(job);
  }
}

/**
 * Ejemplo de módulo que usa la cola de emails
 */
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 10,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
  ],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}

/**
 * Ejemplo de uso en un controller
 */
import { Controller, Post, Body } from '@nestjs/common';

@Controller('notifications')
export class NotificationController {
  constructor(private emailService: EmailService) {}

  @Post('send-email')
  async sendEmail(@Body() data: EmailJobData) {
    const success = await this.emailService.enviarEmail(data);
    return {
      success,
      message: success ? 'Email agregado a la cola' : 'Error agregando email',
    };
  }

  @Post('send-urgent-email')
  async sendUrgentEmail(@Body() data: Omit<EmailJobData, 'prioridad'>) {
    const success = await this.emailService.enviarEmailUrgente(data);
    return {
      success,
      message: success
        ? 'Email urgente agregado a la cola'
        : 'Error agregando email urgente',
    };
  }

  @Post('schedule-email')
  async scheduleEmail(@Body() data: EmailJobData & { delay: number }) {
    const { delay, ...emailData } = data;
    const success = await this.emailService.programarEmail(emailData, delay);
    return {
      success,
      message: success ? 'Email programado' : 'Error programando email',
    };
  }
}
