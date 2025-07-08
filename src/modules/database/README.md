# Módulo 2: Database

## Descripción

Módulo de infraestructura base que proporciona la conexión y configuración de Prisma ORM para acceso a PostgreSQL. Este módulo establece la conexión fundamental que otros módulos utilizan para operaciones de persistencia.

## Responsabilidades

- ✅ **Configuración de Prisma ORM**: Setup y conexión con PostgreSQL usando configuración del Módulo 1
- ✅ **Gestión de Ciclo de Vida**: Conexión y desconexión automática en el lifecycle de NestJS
- ✅ **Provisión de Cliente**: Exportar PrismaService global para inyección en otros módulos
- ✅ **Verificación Básica**: Método simple para verificar estado de conexión

## Uso

### Inyección en otros servicios

```typescript
@Injectable()
export class MiServicio {
  constructor(private prisma: PrismaService) {}

  async buscarDatos() {
    return this.prisma.miTabla.findMany();
  }
}
```

### Verificación de conexión

```typescript
const conectado = await this.prisma.verificarConexion();
if (!conectado) {
  // Manejar problema de conexión
}
```

## Dependencias

- **Módulo 1**: Configuración del Sistema (para obtener configuración de base de datos)
- **@prisma/client**: Cliente Prisma generado
- **prisma**: CLI y herramientas de Prisma

## Scripts Disponibles

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar migraciones en desarrollo
npm run db:migrate

# Aplicar migraciones en producción
npm run db:migrate:deploy

# Reset completo de base de datos
npm run db:migrate:reset

# Push cambios sin migración (desarrollo)
npm run db:push

# Abrir Prisma Studio
npm run db:studio

# Ejecutar seeds
npm run db:seed
```

## Testing

```bash
# Ejecutar pruebas unitarias del módulo
npm test -- database

# Ejecutar pruebas con coverage
npm run test:cov -- database
```

## Configuración Requerida

Variables de entorno que deben estar configuradas:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

## Notas Importantes

- Este módulo es marcado como `@Global()` para estar disponible en toda la aplicación
- No incluye lógica de negocio, solo infraestructura de conexión
- El logging está configurado para ser mínimo (solo errores y warnings)
- El health checking avanzado se maneja en el Módulo 4: Observabilidad
