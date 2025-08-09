import dataSourceConfig from '../../config/database.config';
import { seedRoles } from './01-roles.seed';
import { seedUsuarios } from './02-usuarios.seed';

async function runSeeds() {
  console.log('🌱 Iniciando seeds...\n');

  const dataSource = dataSourceConfig;

  try {
    await dataSource.initialize();
    console.log('📡 Conexión a base de datos establecida\n');

    // Ejecutar seeds en orden
    await seedRoles(dataSource);
    await seedUsuarios(dataSource);

    console.log('\n✅ Todos los seeds ejecutados exitosamente');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📡 Conexión cerrada');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  void runSeeds();
}

export { runSeeds };
