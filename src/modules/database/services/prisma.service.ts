import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfiguracionService } from '../../configuracion/services/configuracion.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configuracionService: ConfiguracionService) {
    // Ahora podemos usar ConfiguracionService porque se inicializa en el constructor
    const dbConfig = configuracionService.baseDatos;

    super({
      datasources: {
        db: {
          url: dbConfig.url,
        },
      },
      log: ['error', 'warn'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Iniciando conexión a base de datos...');

      await this.$connect();

      // Verificar conexión con una query simple
      await this.$executeRaw`SELECT 1`;

      this.logger.log('✅ Conexión a base de datos establecida correctamente');
    } catch (error) {
      this.logger.error('❌ Error al conectar con la base de datos:', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.log('Cerrando conexión a base de datos...');
      await this.$disconnect();
      this.logger.log('✅ Conexión a base de datos cerrada correctamente');
    } catch (error) {
      this.logger.error('❌ Error al cerrar conexión a base de datos:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de la conexión a la base de datos
   * Útil para verificaciones básicas internas
   */
  async verificarConexion(): Promise<boolean> {
    try {
      await this.$executeRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Error en verificación de conexión:', error);
      return false;
    }
  }
}
