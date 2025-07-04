# Application Layer

Esta carpeta contiene la **lógica de aplicación específica** del negocio.

## 📁 Estructura recomendada:

```
application/
├── productos/           # Módulo de productos
│   ├── controllers/     # REST controllers
│   ├── services/        # Servicios de aplicación
│   ├── dto/            # Data Transfer Objects
│   └── queries/        # Query handlers (CQRS)
├── ventas/             # Módulo de ventas
└── clientes/           # Módulo de clientes
```

## 🎯 Propósito:

- **Coordinación**: Orquesta las operaciones de negocio
- **Casos de uso**: Implementa los casos de uso específicos
- **APIs**: Expone endpoints REST para el frontend
- **Validación**: Valida datos de entrada
- **Transformación**: Convierte entre DTOs y entidades de dominio

## 📋 Convenciones:

- Cada módulo debe tener su propia carpeta
- Usar servicios de aplicación para casos de uso complejos
- DTOs para validación y transferencia de datos
- Controllers solo para routing y validación HTTP

## 🔗 Dependencias:

- ✅ Puede usar `@/domain/*` (entidades, value objects, servicios de dominio)
- ✅ Puede usar `@/modules/*` (infraestructura base)
- ❌ No debe conocer detalles de implementación de base de datos
- ❌ No debe contener lógica de negocio (esa va en domain)

## 📝 Ejemplo de uso:

```typescript
// Servicio de aplicación
import { Injectable } from '@nestjs/common';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { Producto } from '@/domain/entities/producto.entity';
import { ProductoRepository } from '@/domain/repositories/producto.repository';

@Injectable()
export class ProductoService {
  constructor(private productoRepository: ProductoRepository) {}

  async crearProducto(dto: CrearProductoDto): Promise<Producto> {
    // Lógica de aplicación: validaciones, transformaciones, coordinación
    const producto = new Producto(dto.nombre, dto.precio);
    return this.productoRepository.save(producto);
  }
}
```
