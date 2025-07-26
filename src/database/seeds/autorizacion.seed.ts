import { DataSource } from 'typeorm';
import { Rol } from '../../modules/autorizacion/entities/rol.entity';
import { Politica } from '../../modules/autorizacion/entities/politica.entity';
import {
  AccionHttp,
  AplicacionTipo,
  EstadoRol,
} from '../../modules/autorizacion/enums/autorizacion.enums';

export async function seedAutorizacion(dataSource: DataSource): Promise<void> {
  console.log('🔐 Creando roles y políticas básicas...');

  const rolRepository = dataSource.getRepository(Rol);
  const politicaRepository = dataSource.getRepository(Politica);

  // 1. Crear roles básicos
  const rolesBasicos = [
    {
      nombre: 'Administrador',
      codigo: 'ADMIN',
      descripcion: 'Acceso completo al sistema',
      estado: EstadoRol.ACTIVO,
      usuarioCreacion: 'sistema',
    },
    {
      nombre: 'Usuario',
      codigo: 'USER',
      descripcion: 'Usuario estándar del sistema',
      estado: EstadoRol.ACTIVO,
      usuarioCreacion: 'sistema',
    },
    {
      nombre: 'Solo Lectura',
      codigo: 'READONLY',
      descripcion: 'Acceso de consulta únicamente',
      estado: EstadoRol.ACTIVO,
      usuarioCreacion: 'sistema',
    },
  ];

  for (const rolData of rolesBasicos) {
    const existeRol = await rolRepository.findOne({
      where: { codigo: rolData.codigo },
    });

    if (!existeRol) {
      await rolRepository.save(rolData);
      console.log(`✅ Rol creado: ${rolData.nombre} (${rolData.codigo})`);
    }
  }

  // 2. Crear políticas básicas para ADMIN
  const politicasAdmin = [
    // Acceso completo a rutas admin
    {
      rol: 'ADMIN',
      recurso: '/admin/*',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/admin/*',
      accion: AccionHttp.POST,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/admin/*',
      accion: AccionHttp.PUT,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/admin/*',
      accion: AccionHttp.DELETE,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/admin/*',
      accion: AccionHttp.PATCH,
      aplicacion: AplicacionTipo.BACKEND,
    },

    // Acceso a módulos de autorización
    {
      rol: 'ADMIN',
      recurso: '/api/v1/autorizacion/*',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/api/v1/autorizacion/*',
      accion: AccionHttp.POST,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/api/v1/autorizacion/*',
      accion: AccionHttp.PUT,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/api/v1/autorizacion/*',
      accion: AccionHttp.DELETE,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/api/v1/autorizacion/*',
      accion: AccionHttp.PATCH,
      aplicacion: AplicacionTipo.BACKEND,
    },

    // Acceso a configuración del sistema
    {
      rol: 'ADMIN',
      recurso: '/api/v1/sistema/configuracion',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/api/v1/sistema/validar-configuracion',
      accion: AccionHttp.POST,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'ADMIN',
      recurso: '/api/v1/sistema/conectividad',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
  ];

  // 3. Crear políticas básicas para USER
  const politicasUser = [
    // Acceso a perfil propio
    {
      rol: 'USER',
      recurso: '/usuarios/perfil',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'USER',
      recurso: '/usuarios/perfil',
      accion: AccionHttp.PUT,
      aplicacion: AplicacionTipo.BACKEND,
    },

    // Acceso a auth
    {
      rol: 'USER',
      recurso: '/api/v1/auth/*',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
    {
      rol: 'USER',
      recurso: '/api/v1/auth/*',
      accion: AccionHttp.POST,
      aplicacion: AplicacionTipo.BACKEND,
    },

    // Acceso a dashboard básico
    {
      rol: 'USER',
      recurso: '/dashboard',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },
  ];

  // 4. Crear políticas básicas para READONLY
  const politicasReadonly = [
    // Solo consultas al perfil
    {
      rol: 'READONLY',
      recurso: '/usuarios/perfil',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },

    // Solo consultas al dashboard
    {
      rol: 'READONLY',
      recurso: '/dashboard',
      accion: AccionHttp.GET,
      aplicacion: AplicacionTipo.BACKEND,
    },

    // Solo logout
    {
      rol: 'READONLY',
      recurso: '/api/v1/auth/logout',
      accion: AccionHttp.POST,
      aplicacion: AplicacionTipo.BACKEND,
    },
  ];

  // Insertar todas las políticas
  const todasLasPoliticas = [
    ...politicasAdmin,
    ...politicasUser,
    ...politicasReadonly,
  ];

  for (const politicaData of todasLasPoliticas) {
    const existePolitica = await politicaRepository.findOne({
      where: {
        rol: politicaData.rol,
        recurso: politicaData.recurso,
        accion: politicaData.accion,
        aplicacion: politicaData.aplicacion,
      },
    });

    if (!existePolitica) {
      await politicaRepository.save({
        ...politicaData,
        usuarioCreacion: 'sistema',
      });
    }
  }

  console.log(`✅ ${politicasAdmin.length} políticas creadas para ADMIN`);
  console.log(`✅ ${politicasUser.length} políticas creadas para USER`);
  console.log(`✅ ${politicasReadonly.length} políticas creadas para READONLY`);
  console.log('🔐 Seed de autorización completado');
}
