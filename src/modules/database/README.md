# Módulo 2: Base de Datos

## **Configuración de TypeORM para PostgreSQL**

## 📋 Descripción

Módulo que establece la **configuración de TypeORM** para acceso type-safe a PostgreSQL. Es la capa de infraestructura de datos que otros módulos utilizan para operaciones de persistencia.

## ✨ Características

- ✅ **TypeORM configurado**: Integración completa con NestJS
- ✅ **BaseEntity**: Entidad base con campos de auditoría estándar
- ✅ **Configuración por ambiente**: Desarrollo vs Producción
- ✅ **Pool de conexiones**: Optimizado para alta concurrencia
- ✅ **Migrations**: Sistema de migraciones para cambios de schema
- ✅ **Auto-detección**: Entities se cargan automáticamente
- ✅ **Type Safety**: Tipado estricto end-to-end
- ✅ **Soft Deletes**: Eliminación lógica incorporada
- ✅ **Auditoría**: Campos de auditoría automáticos
- ✅ **Global Module**: Disponible en toda la aplicación

## 🚀 Configuración e Instalación

### 1. Variables de Entorno (ya configuradas en Módulo 1)

El módulo usa la configuración del **Módulo 1: Configuración**:

```bash
# Variables de base de datos (gestionadas por ConfiguracionService)
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASSWORD=password
DB_NAME=database_name
DB_SSL=false
NODE_ENV=development
```

### 2. Importación en AppModule

```typescript
// app.module.ts - ORDEN IMPORTANTE
@Module({
  imports: [
    ConfiguracionModule, // ← PRIMERO: Base fundamental
    DatabaseModule, // ← SEGUNDO: Depende de ConfiguracionModule
    RedisModule, // ← TERCERO: Independiente
    ResponseModule, // ← CUARTO: Respuestas estandarizadas
    // ... otros módulos
  ],
})
export class AppModule {}
```

### 3. Verificación de Conexión

```bash
# Iniciar aplicación
npm run start:dev

# Verificar en logs:
# ✅ Conexión a base de datos establecida correctamente

# Verificar health check
curl http://localhost:3001/sistema/health | jq '.data.servicios.baseDatos'
# Debería retornar: "conectado"
```

## 🏗️ BaseEntity - Entidad Base

### Campos Incluidos

```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number; // ID autoincremental

  @CreateDateColumn()
  fechaCreacion: Date; // Timestamp de creación

  @UpdateDateColumn()
  fechaModificacion: Date; // Timestamp de última modificación

  @DeleteDateColumn()
  fechaEliminacion?: Date; // Soft delete timestamp

  @Column()
  usuarioCreacion?: string; // Quién creó el registro

  @Column()
  usuarioModificacion?: string; // Quién modificó el registro

  @Column()
  usuarioEliminacion?: string; // Quién eliminó el registro

  @Column({ default: true })
  isActive: boolean; // Estado activo/eliminado del registro

  // Métodos de conveniencia
  get isActivo(): boolean;
  get isEliminado(): boolean;
  marcarComoEliminado(usuario?: string): void;
  restaurar(usuario?: string): void;
  actualizarAuditoria(usuario?: string): void;
}
```

### Uso en Otras Entidades

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@/modules/database';

@Entity('usuarios')
export class Usuario extends BaseEntity {
  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  // Campos de BaseEntity se incluyen automáticamente:
  // id, fechaCreacion, fechaModificacion, fechaEliminacion,
  // usuarioCreacion, usuarioModificacion, usuarioEliminacion, isActive
}
```

## 💾 Uso en Servicios

### Inyección de Repository

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository, Repository } from '@/modules/database';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async crear(datos: CreateUsuarioDto): Promise<Usuario> {
    const usuario = this.usuarioRepository.create(datos);
    usuario.usuarioCreacion = 'sistema'; // Auditoría
    return await this.usuarioRepository.save(usuario);
  }

  async buscarActivos(): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      where: { isActive: true },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async eliminarSoft(id: number, usuario: string): Promise<void> {
    await this.usuarioRepository.softDelete(id);

    // Actualizar campos de auditoría
    await this.usuarioRepository.update(id, {
      usuarioEliminacion: usuario,
      isActive: false,
    });
  }
}
```

### Inyección de DataSource (para queries complejas)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectDataSource, DataSource } from '@/modules/database';

@Injectable()
export class ReporteService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async obtenerEstadisticas(): Promise<any> {
    return await this.dataSource.query(`
      SELECT 
        _is_active,
        COUNT(*) as total
      FROM usuarios 
      WHERE _fecha_eliminacion IS NULL
      GROUP BY _is_active
    `);
  }
}
```

### Inyección de EntityManager (para transacciones)

```typescript
import { Injectable } from '@nestjs/common';
import { InjectEntityManager, EntityManager } from '@/modules/database';

@Injectable()
export class TransaccionService {
  constructor(
    @InjectEntityManager()
    private entityManager: EntityManager,
  ) {}

  async crearUsuarioConPerfil(userData: any, profileData: any): Promise<void> {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      const usuario = await transactionalEntityManager.save(Usuario, userData);
      profileData.usuarioId = usuario.id;
      await transactionalEntityManager.save(Perfil, profileData);
    });
  }
}
```

## 🔄 Migraciones

### Scripts Disponibles

```bash
# Generar migración automáticamente basada en cambios de entities
npm run migration:generate -- src/database/migrations/CreateUsers

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Sincronizar schema (solo desarrollo - ¡CUIDADO!)
npm run schema:sync
```

### Flujo de Trabajo con Migraciones

```bash
# 1. Crear/modificar entity
# src/modules/usuarios/entities/usuario.entity.ts

# 2. Generar migración
npm run migration:generate -- src/database/migrations/CreateUsuario

# 3. Revisar migración generada
# src/database/migrations/1234567890123-CreateUsuario.ts

# 4. Ejecutar migración
npm run migration:run

# 5. Verificar en base de datos
```

## 🔧 Configuración Avanzada

### Pool de Conexiones

El módulo está configurado para **alta concurrencia**:

```typescript
extra: {
  max: 20,                    // Máximo 20 conexiones simultáneas
  min: 5,                     // Mínimo 5 conexiones en pool
  acquireTimeoutMillis: 60000, // 60s timeout para obtener conexión
  idleTimeoutMillis: 600000,   // 10min timeout para conexiones idle
}
```

### Configuración por Ambiente

#### Desarrollo

```typescript
synchronize: true,              // Auto-sync de schema
logging: ['query', 'error'],   // Logs detallados
```

#### Producción

```typescript
synchronize: false,            // Solo migraciones
logging: ['error'],           // Solo errores
ssl: true,                    // Conexión segura
```

## 📊 Características TypeORM Habilitadas

### Auto-detección de Entities

```typescript
entities: [__dirname + '/../**/*.entity{.ts,.js}'],
autoLoadEntities: true,
```

### Soft Deletes Automático

```typescript
// BaseEntity incluye @DeleteDateColumn
fechaEliminacion?: Date;

// Uso automático:
await repository.softDelete(id);
await repository.restore(id);

// Queries excluyen registros eliminados automáticamente
await repository.find(); // Solo registros no eliminados
```

## 🧪 Testing

### Testing de Repositorios

```typescript
describe('UsuarioService', () => {
  let service: UsuarioService;
  let repository: Repository<Usuario>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UsuarioService],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);
    repository = module.get<Repository<Usuario>>(getRepositoryToken(Usuario));
  });

  it('debe crear usuario con auditoría', async () => {
    const userData = { nombre: 'Juan', email: 'juan@test.com' };
    const usuario = await service.crear(userData);

    expect(usuario.id).toBeDefined();
    expect(usuario.usuarioCreacion).toBe('sistema');
    expect(usuario.fechaCreacion).toBeDefined();
    expect(usuario.isActive).toBe(true);
  });
});
```

## 🚨 Mejores Prácticas

### Naming Conventions

```typescript
// ✅ Correcto
@Entity('usuarios')              // Tabla en snake_case plural
export class Usuario extends BaseEntity {
  @Column({ name: 'nombre_completo' })  // Columna en snake_case
  nombreCompleto: string;               // Propiedad en camelCase
}

// ❌ Incorrecto
@Entity('Usuario')               // No usar PascalCase
@Entity('usuario')               // No usar singular
```

### Índices Estratégicos

```typescript
@Entity('usuarios')
@Index(['email']) // Índice para búsquedas por email
@Index(['isActive', 'fechaCreacion']) // Índice compuesto para queries comunes
export class Usuario extends BaseEntity {
  @Column({ unique: true })
  @Index() // Índice adicional si es necesario
  email: string;
}
```

## 🔧 Troubleshooting

### Error: "No repository found"

**Síntomas:**

```
No repository for "Usuario" was found. Looks like this entity is not registered in current "default" connection?
```

**Solución:**

1. Verificar que la entity esté decorada con `@Entity()`
2. Verificar que esté en el path correcto para auto-detección
3. Agregar el módulo al `forFeature()` si es necesario:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuarioService],
})
export class UsuarioModule {}
```

### Error: "Connection timeout"

**Síntomas:**

```
TimeoutError: Timeout acquiring a connection. The pool is probably full.
```

**Solución:**

1. Verificar configuración del pool de conexiones
2. Cerrar conexiones correctamente en servicios
3. Revisar queries lentos que bloquean el pool

## 🔗 Integración con Otros Módulos

### Módulos que Usan DatabaseModule

- **Módulo 6**: Autenticación (entities Usuario, Sesion)
- **Módulo 7**: Autorización (entities Rol, Permiso)
- **Módulo 8**: Gestión de Usuarios (repositories y servicios)
- **Módulo 9**: Configuración General (entity ConfiguracionGeneral)
- **Módulo 10**: Gestión de Archivos (entity Archivo)
- **Módulo 11**: Comunicaciones (entities Email, Notificacion)
- **Módulo 12**: Reportes (queries complejas)

### Patrón de Importación

```typescript
// En módulos específicos
@Module({
  imports: [
    DatabaseModule, // ← Importar DatabaseModule
    TypeOrmModule.forFeature([Usuario]), // ← Registrar entities específicas
  ],
  providers: [UsuarioService],
  exports: [UsuarioService],
})
export class UsuarioModule {}
```

## ✅ Criterios de Aceptación

- ✅ **Conexión exitosa** a PostgreSQL usando configuración del Módulo 1
- ✅ **TypeORM configurado** correctamente para toda la aplicación
- ✅ **BaseEntity disponible** para extensión en otros módulos
- ✅ **Auto-detección** de entities funcionando
- ✅ **Pool de conexiones** optimizado
- ✅ **Migrations configuradas** y funcionando
- ✅ **Soft deletes** implementados automáticamente
- ✅ **Campos de auditoría** estándar
- ✅ **Type safety** completo
- ✅ **Logging apropiado** de eventos de conexión
- ✅ **Sin funcionalidad de negocio** específica (solo infraestructura)

## 🏆 Conclusión

El Módulo de Base de Datos proporciona la **infraestructura de persistencia fundamental** para toda la aplicación. Su implementación sólida garantiza:

- **🔧 Simplicidad**: Solo se encarga de la configuración de TypeORM
- **💪 Estabilidad**: Configuración robusta con factory pattern
- **🔄 Reutilización**: Repositories disponibles para todos los módulos
- **📊 Estándar**: Sigue las mejores prácticas de TypeORM + NestJS
- **🧪 Testing**: Completamente testeable con mocks y pruebas de integración
- **⚡ Performance**: Pool de conexiones optimizado para producción
- **🔒 Seguridad**: Configuración segura por ambiente
- **📈 Escalabilidad**: Preparado para crecimiento de la aplicación

### Próximos Pasos

1. **Verificar conexión** TypeORM con health check
2. **Crear primera entity** extendiendo BaseEntity
3. **Generar primera migración** para validar configuración
4. **Implementar primer repository** en módulo específico
5. **Validar audit trail** con operaciones CRUD

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa logs** de conexión TypeORM al iniciar
2. **Verifica variables** de base de datos en Módulo 1
3. **Consulta health check** en `/sistema/health`
4. **Revisa pool de conexiones** si hay timeouts
5. **Valida entities** estén correctamente decoradas
