import { DataSource } from 'typeorm';
import { Rol } from '../../modules/autorizacion/entities/rol.entity';
import { CasbinRule } from '../../modules/autorizacion/entities/casbin-rule.entity';

export async function seedAutorizacion(dataSource: DataSource): Promise<void> {
  console.log('🔐 Seeding autorización...');

  const rolRepository = dataSource.getRepository(Rol);
  const casbinRuleRepository = dataSource.getRepository(CasbinRule);

  // Roles básicos
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
      const rol = rolRepository.create({
        ...rolData,
        // usuarioCreacion: null, // Autoregistro sin usuario autenticado
      });
      await rolRepository.save(rol);
      console.log(`  ✅ Rol creado: ${rolData.codigo}`);
    }
  }

  // Políticas básicas de Casbin
  const politicas = [
    // ADMINISTRADOR
    { ptype: 'p', v0: 'ADMINISTRADOR', v1: '/api/v1/*', v2: 'GET' },
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
      v1: '/api/v1/autorizacion/roles',
      v2: 'POST',
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
    {
      ptype: 'p',
      v0: 'ADMINISTRADOR',
      v1: '/api/v1/autorizacion/politicas',
      v2: 'POST',
    },

    // USUARIO
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/usuarios/:id', v2: 'GET' },
    { ptype: 'p', v0: 'USUARIO', v1: '/api/v1/usuarios/:id', v2: 'PUT' },

    // INVITADO
    { ptype: 'p', v0: 'INVITADO', v1: '/api/v1/usuarios/:id', v2: 'GET' },
  ];

  for (const politica of politicas) {
    const existente = await casbinRuleRepository.findOne({
      where: {
        ptype: politica.ptype,
        v0: politica.v0,
        v1: politica.v1,
        v2: politica.v2,
      },
    });

    if (!existente) {
      const rule = casbinRuleRepository.create(politica);
      await casbinRuleRepository.save(rule);
    }
  }

  console.log('  ✅ Políticas básicas configuradas');
}
