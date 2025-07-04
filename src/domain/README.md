# Domain Layer

Esta carpeta contiene el **corazón del negocio** - las reglas, entidades y lógica de dominio.

## 📁 Estructura:

```
domain/
├── entities/           # Entidades de dominio
├── value-objects/      # Value Objects
├── services/          # Servicios de dominio
└── repositories/      # Interfaces de repositorios
```

## 🎯 Propósito:

- **Entidades**: Objetos con identidad que representan conceptos del negocio
- **Value Objects**: Objetos inmutables que representan valores
- **Servicios de Dominio**: Lógica de negocio que no pertenece a una entidad específica
- **Repositorios**: Interfaces para persistencia (implementadas en infraestructura)

## 📋 Principios:

- **Independiente**: No depende de frameworks ni infraestructura
- **Puro**: Solo lógica de negocio, sin efectos secundarios
- **Testeable**: Fácil de testear unitariamente
- **Expresivo**: Usa el lenguaje del dominio (ubiquitous language)

## 🔗 Dependencias:

- ❌ **NO** debe depender de `@/modules/*` (infraestructura)
- ❌ **NO** debe depender de `@/application/*`
- ✅ Puede depender de otras entidades/value objects del dominio
- ✅ Solo dependencias de TypeScript y librerías de dominio puras

## 📝 Ejemplos:

### Entidad:
```typescript
// entities/producto.entity.ts
export class Producto {
  constructor(
    private readonly id: ProductoId,
    private nombre: string,
    private precio: Precio,
  ) {}

  cambiarPrecio(nuevoPrecio: Precio): void {
    if (nuevoPrecio.valor <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }
    this.precio = nuevoPrecio;
  }
}
```

### Value Object:
```typescript
// value-objects/precio.value-object.ts
export class Precio {
  constructor(public readonly valor: number) {
    if (valor < 0) {
      throw new Error('El precio no puede ser negativo');
    }
  }

  equals(otro: Precio): boolean {
    return this.valor === otro.valor;
  }
}
```

### Servicio de Dominio:
```typescript
// services/calculador-descuento.service.ts
export class CalculadorDescuento {
  calcular(producto: Producto, cliente: Cliente): Descuento {
    // Lógica compleja de descuentos que involucra múltiples entidades
    if (cliente.esVip() && producto.esEnCategoria('premium')) {
      return new Descuento(0.15); // 15%
    }
    return new Descuento(0);
  }
}
```

### Interface de Repositorio:
```typescript
// repositories/producto.repository.ts
export interface ProductoRepository {
  findById(id: ProductoId): Promise<Producto | null>;
  save(producto: Producto): Promise<void>;
  findByCategoria(categoria: string): Promise<Producto[]>;
}
```
