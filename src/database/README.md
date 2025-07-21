# Migrations Directory

Este directorio contiene las migraciones de TypeORM.

## Comandos útiles:

Creamos los esquemas correspondientes

```
CREATE SCHEMA sistema;
CREATE SCHEMA usuarios;
CREATE SCHEMA administracion;
CREATE SCHEMA mensajeria;
```

```bash
# Generar migración automáticamente
npm run migration:generate -- src/database/migrations/CreateUsers

# Ejecutar migraciones
npm run migration:run

# Revertir última migración
npm run migration:revert

# Sincronizar schema (solo desarrollo)
npm run schema:sync
```

## Convenciones:

- Nombres descriptivos: `CreateUsers`, `AddEmailToUsers`, etc.
- Una migración por cambio lógico
- Siempre revisar antes de ejecutar en producción
