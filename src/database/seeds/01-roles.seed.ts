import { DataSource } from 'typeorm';
import { Rol } from '../../modules/autorizacion/entities/rol.entity';
import { CasbinRule } from '../../modules/autorizacion/entities/casbin-rule.entity';

export async function seedRoles(dataSource: DataSource): Promise<void> {
  console.log('🔐 Seeding roles y permisos...');

  const rolRepository = dataSource.getRepository(Rol);
  const casbinRuleRepository = dataSource.getRepository(CasbinRule);

  // 1. Crear roles básicos
  const roles = [
    {
      codigo: 'ADMINISTRADOR',
      nombre: 'Administrador',
      descripcion: 'Administrador del sistema con acceso completo',
      esSistema: true,
    },
    {
      codigo: 'USUARIO',
      nombre: 'Usuario',
      descripcion: 'Usuario estándar del sistema',
      esSistema: false,
    },
    {
      codigo: 'INVITADO',
      nombre: 'Invitado',
      descripcion: 'Usuario con permisos limitados',
      esSistema: false,
    },
  ];

  for (const rolData of roles) {
    const existente = await rolRepository.findOne({
      where: { codigo: rolData.codigo },
    });

    if (!existente) {
      const rol = rolRepository.create(rolData);
      await rolRepository.save(rol);
      console.log(`  ✅ Rol creado: ${rolData.codigo}`);
    } else {
      console.log(`  ⚠️  Rol ya existe: ${rolData.codigo}`);
    }
  }

  // 2. Limpiar políticas existentes para actualizar
  await casbinRuleRepository.clear();
  console.log('  🧹 Políticas anteriores limpiadas');

  // 3. Políticas actualizadas con rutas reales del sistema
  const politicas = [
    // === ADMINISTRADOR - Acceso completo ===

    // Usuarios
    { ptype: 'p', v0: 'ADMINISTRADOR', v1: '/api/v1/usuarios', v2: 'GET' },
    { ptype: 'p', v0: 'ADMINISTRADOR', v1: '/api/v1/usuarios/:id', v2: 'GET' },
    { ptype: 'p', v0: 'ADMINISTRADOR', v1: '/api/v1/usuarios/:id', v2: 'PUT' },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/usuarios/:id',
      v2: 'DELETE',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/usuarios/:id/estado',
      v2: 'PUT',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/usuarios/:id/restaurar',
      v2: 'PUT',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/usuarios/estadisticas',
      v2: 'GET',
    },

    // Roles y autorización
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/roles',
      v2: 'GET',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/roles',
      v2: 'POST',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/roles/:id',
      v2: 'GET',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/roles/:id',
      v2: 'PUT',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/roles/:id',
      v2: 'DELETE',
    },

    // Políticas
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/politicas',
      v2: 'GET',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/politicas',
      v2: 'POST',
    },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/politicas/:id',
      v2: 'DELETE',
    },

    // Auditoría
    { ptype: 'p', v0: 'ADMINISTRADOR', v1: '/api/v1/auditoria', v2: 'GET' },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/auditoria/estadisticas',
      v2: 'GET',
    },

    // === USUARIO - Permisos propios ===

    // Perfil personal
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/usuarios/perfil', v2: 'GET' },
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/usuarios/perfil', v2: 'PUT' },
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/usuarios/avatar', v2: 'PUT' },
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/usuarios/avatar', v2: 'DELETE' },
    {
      ptype: 'p',
      v0: 'USUARIO',
      v1: '/api/v1/usuarios/cambiar-password',
      v2: 'PUT',
    },

    // === INVITADO - Solo lectura básica ===
    { ptype: 'p', v0: 'INVITADO', v1: '/api/v1/usuarios/perfil', v2: 'GET' },

    // === PERMISOS GLOBALES (para todos los roles) ===

    // Autenticación (sin roles específicos, manejado por guards)
    { ptype: 'p', v0: 'ADMINISTRADOR', v1: '/api/v1/auth/logout', v2: 'POST' },
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/auth/logout-all',
      v2: 'POST',
    },
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/auth/logout', v2: 'POST' },
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/auth/logout-all', v2: 'POST' },
    { ptype: 'p', v0: 'INVITADO', v1: '/api/v1/auth/logout', v2: 'POST' },
  ];

  // 4. Insertar nuevas políticas
  for (const politica of politicas) {
    const rule = casbinRuleRepository.create(politica);
    await casbinRuleRepository.save(rule);
  }

  console.log(`  ✅ ${politicas.length} políticas configuradas`);
  console.log('  📋 Roles disponibles: ADMINISTRADOR, USUARIO, INVITADO');
}
