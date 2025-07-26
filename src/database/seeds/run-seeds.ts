import { DataSource } from 'typeorm';
import { seedAutorizacion } from './autorizacion.seed';
import dotenv from 'dotenv';

dotenv.config();

async function runSeeds() {
  console.log('🌱 Iniciando seeds...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_base_db',
    ssl: process.env.DB_SSL === 'true',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a base de datos establecida');

    // Ejecutar seeds
    await seedAutorizacion(dataSource);

    console.log('🎉 Todos los seeds completados exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Conexión cerrada');
  }
}

void runSeeds();
