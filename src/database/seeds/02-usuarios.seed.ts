import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../modules/usuarios/entities/usuario.entity';
import { PerfilUsuario } from '../../modules/usuarios/entities/perfil-usuario.entity';
import { UsuarioRol } from '../../modules/autorizacion/entities/usuario-rol.entity';
import { Rol } from '../../modules/autorizacion/entities/rol.entity';
import { EstadoUsuario } from '../../modules/usuarios/enums/usuario.enum';

interface UsuarioData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  biografia: string;
  rolCodigo: string;
}

export async function seedUsuarios(dataSource: DataSource): Promise<void> {
  console.log('👤 Seeding usuarios...');

  const usuarioRepository = dataSource.getRepository(Usuario);
  const rolRepository = dataSource.getRepository(Rol);

  // Definir usuarios a crear
  const usuariosData: UsuarioData[] = [
    {
      email: 'admin@sistema.com',
      password: 'Admin123!',
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '+1234567890',
      biografia: 'Administrador principal del sistema',
      rolCodigo: 'ADMINISTRADOR',
    },
    {
      email: 'usuario@ejemplo.com',
      password: 'Usuario123!',
      nombre: 'Usuario',
      apellido: 'Prueba',
      biografia: 'Usuario de prueba del sistema',
      rolCodigo: 'USUARIO',
    },
  ];

  // Procesar cada usuario
  for (const userData of usuariosData) {
    console.log(`\n🔄 Procesando: ${userData.email}`);

    // 1. Verificar si existe
    const usuarioExistente = await usuarioRepository.findOne({
      where: { email: userData.email },
    });

    if (usuarioExistente) {
      console.log(`  ⚠️  Ya existe: ${userData.email}`);
      continue;
    }

    // 2. Buscar rol
    const rol = await rolRepository.findOne({
      where: { codigo: userData.rolCodigo },
    });

    if (!rol) {
      console.log(
        `  ❌ Rol ${userData.rolCodigo} no encontrado para ${userData.email}`,
      );
      continue;
    }

    // 3. Crear usuario en transacción
    try {
      await dataSource.transaction(async (transactionalEntityManager) => {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Crear usuario
        const nuevoUsuario = transactionalEntityManager.create(Usuario, {
          email: userData.email,
          password: hashedPassword,
          nombre: userData.nombre,
          estado: EstadoUsuario.ACTIVO,
          emailVerificado: true,
          fechaVerificacionEmail: new Date(),
        });

        const usuarioGuardado = await transactionalEntityManager.save(
          Usuario,
          nuevoUsuario,
        );

        // Crear perfil
        const nuevoPerfil = transactionalEntityManager.create(PerfilUsuario, {
          usuario: usuarioGuardado,
          apellido: userData.apellido,
          telefono: userData.telefono,
          biografia: userData.biografia,
        });

        await transactionalEntityManager.save(PerfilUsuario, nuevoPerfil);

        // Asignar rol
        const usuarioRol = transactionalEntityManager.create(UsuarioRol, {
          usuario: usuarioGuardado,
          rol: rol,
        });

        await transactionalEntityManager.save(UsuarioRol, usuarioRol);
      });

      console.log(`  ✅ Usuario creado: ${userData.email}`);
      console.log(`     🛡️  Rol: ${userData.rolCodigo}`);
      console.log(`     👤 Nombre: ${userData.nombre} ${userData.apellido}`);
    } catch (error) {
      console.log(`  ❌ Error creando ${userData.email}:`, error);
    }
  }

  console.log('\n🎯 Usuarios seed completado');
  console.log('═══════════════════════════════════════');
  console.log('📝 CREDENCIALES DE ACCESO:');
  console.log('');

  for (const userData of usuariosData) {
    const rolLabel =
      userData.rolCodigo === 'ADMINISTRADOR'
        ? '👨‍💼 ADMINISTRADOR'
        : '👤 USUARIO';
    console.log(`${rolLabel}:`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Password: ${userData.password}`);
    console.log('');
  }
}
