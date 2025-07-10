# Módulo 5: Observabilidad

Sistema centralizado de **logging con Winston** y **auditoría completa** para toda la aplicación en **todos los contextos**.

## 🎯 **Características Principales**

- ✅ **Winston configurado automáticamente** via Módulo 1 (validación Zod)
- ✅ **Logging estructurado** con contexto enriquecido y sanitización automática
- ✅ **Auditoría en TODOS los contextos** - HTTP, procesos internos, cron jobs
- ✅ **Auditoría automática** con decorador `@Auditable()`
- ✅ **Auditoría manual** para casos complejos de negocio
- ✅ **Rotación de archivos** configurada por ambiente
- ✅ **Trazabilidad completa** de cambios en entidades críticas
- ✅ **API compatible** con Logger de NestJS (migración transparente)

## 🚀 **Uso Rápido**

### **Logging Centralizado**

```typescript
// En cualquier servicio - Inyección automática
@Injectable()
export class UsuarioService {
  constructor(private logger: LoggerService) {}

  async crearUsuario(datos: CreateUserDto) {
    this.logger.log('Creando usuario', {
      context: 'UsuarioService',
      email: datos.email,
    });

    try {
      const usuario = await this.prisma.usuario.create({ data: datos });

      this.logger.log('Usuario creado exitosamente', {
        context: 'UsuarioService',
        usuarioId: usuario.id,
      });

      return usuario;
    } catch (error) {
      this.logger.logError(error, {
        context: 'UsuarioService.crearUsuario',
        email: datos.email,
      });
      throw error;
    }
  }
}
```

## 📊 **Auditoría en Múltiples Contextos**

### **🌐 1. Auditoría Automática (HTTP Requests)**

```typescript
// En cualquier controlador - Decorador simple
@Controller('usuarios')
export class UsuarioController {
  @Post()
  @Auditable({ includeNewValues: true })
  async crear(@Body() datos: CreateUserDto) {
    return this.usuarioService.crear(datos);
    // ↑ Automáticamente registra en auditoria_logs
  }

  @Put(':id')
  @Auditable({
    includeOldValues: true,
    includeNewValues: true,
    skipFields: ['password'],
  })
  async actualizar(@Param('id') id: number, @Body() datos: UpdateUserDto) {
    return this.usuarioService.actualizar(id, datos);
  }

  @Delete(':id')
  @AuditableDelete('usuarios') // Decorador especializado
  async eliminar(@Param('id') id: number) {
    return this.usuarioService.eliminar(id);
  }
}
```

### **👤 2. Auditoría Manual con Usuario Conocido**

```typescript
// Para imports, operaciones manuales, scripts ejecutados por usuario
@Injectable()
export class ImportService {
  constructor(private auditoriaService: AuditoriaService) {}

  async importarProductosCSV(archivo: string, usuarioId: number) {
    const productos = await this.parsearCSV(archivo);
    
    for (const producto of productos) {
      const nuevoProducto = await this.prisma.producto.create({ data: producto });
      
      // ✅ Auditoría manual con usuario y contexto específico
      const metadata = this.auditoriaService.extractMetadataFromUser(usuarioId, {
        origen: 'import_csv',
        archivo: archivo,
        totalRegistros: productos.length,
        tipoImport: 'productos_masivo'
      });
      
      await this.auditoriaService.registrarCreacion(
        'productos',
        nuevoProducto.id.toString(),
        nuevoProducto,
        metadata
      );
    }
  }
}
```

### **🤖 3. Auditoría de Procesos Automáticos**

```typescript
// Para cron jobs, workers, ajustes automáticos del sistema
@Injectable()
export class InventarioService {
  constructor(private auditoriaService: AuditoriaService) {}

  @Cron('0 2 * * *') // Cada día a las 2 AM
  async depreciarInventario() {
    const productos = await this.prisma.producto.findMany({
      where: { requiereDepreciacion: true }
    });
    
    for (const producto of productos) {
      const valoresAnteriores = { valor: producto.valor };
      
      const productoActualizado = await this.prisma.producto.update({
        where: { id: producto.id },
        data: { valor: producto.valor * 0.95 } // 5% depreciación
      });
      
      // ✅ Auditoría de proceso automático sin usuario
      const metadata = this.auditoriaService.extractMetadataFromSystem('cron_depreciacion', {
        porcentajeDepreciacion: 5,
        fechaProceso: new Date(),
        productosAfectados: productos.length,
        valorAnterior: valoresAnteriores.valor,
        valorNuevo: productoActualizado.valor
      });
      
      await this.auditoriaService.registrarActualizacion(
        'productos',
        producto.id.toString(),
        valoresAnteriores,
        { valor: productoActualizado.valor },
        metadata
      );
    }
  }

  @Process('ajustar-stock') // Background worker
  async ajustarStock(job: Job<{ productoId: number, ajuste: number }>) {
    const { productoId, ajuste } = job.data;
    
    const producto = await this.prisma.producto.findUnique({ where: { id: productoId } });
    const nuevoStock = producto.stock + ajuste;
    
    await this.prisma.producto.update({
      where: { id: productoId },
      data: { stock: nuevoStock }
    });
    
    // ✅ Auditoría desde worker background
    const metadata = this.auditoriaService.extractMetadataFromSystem('worker_ajuste_stock', {
      jobId: job.id,
      tipoAjuste: ajuste > 0 ? 'entrada' : 'salida',
      cantidad: Math.abs(ajuste),
      stockAnterior: producto.stock,
      stockNuevo: nuevoStock
    });
    
    await this.auditoriaService.registrarActualizacion(
      'productos',
      productoId.toString(),
      { stock: producto.stock },
      { stock: nuevoStock },
      metadata
    );
  }
}
```

## 🔧 **API del AuditoriaService**

### **Métodos de Extracción de Metadatos**

```typescript
// Para HTTP requests (usado automáticamente por interceptor)
extractMetadata(context: ExecutionContext): AuditoriaMetadata

// Para operaciones con usuario conocido
extractMetadataFromUser(userId: number, extraData?: Partial<AuditoriaMetadata>): AuditoriaMetadata

// Para procesos automáticos del sistema
extractMetadataFromSystem(origen: string, extraData?: Partial<AuditoriaMetadata>): AuditoriaMetadata
```

### **Métodos de Registro**

```typescript
// Registro directo (usar para casos muy específicos)
async crear(entry: AuditoriaEntry): Promise<AuditoriaLog>

// Métodos especializados por operación
async registrarCreacion(tabla: string, idRegistro: string, valoresNuevos: any, metadata: AuditoriaMetadata): Promise<AuditoriaLog>
async registrarActualizacion(tabla: string, idRegistro: string, antes: any, despues: any, metadata: AuditoriaMetadata): Promise<AuditoriaLog>
async registrarEliminacion(tabla: string, idRegistro: string, valoresAnteriores: any, metadata: AuditoriaMetadata): Promise<AuditoriaLog>
```

### **Métodos de Consulta**

```typescript
// Consulta con filtros
async buscar(query: AuditoriaQuery): Promise<{ data: AuditoriaLog[]; total: number }>

// Consulta usando DTOs (para endpoints HTTP)
async buscarConDto(dto: AuditoriaQueryDto): Promise<{ data: AuditoriaLog[]; total: number }>

// Estadísticas de auditoría
async obtenerEstadisticas(fechaDesde?: Date, fechaHasta?: Date): Promise<AuditoriaStats>

// Historial de un registro específico
async buscarHistorial(tabla: string, idRegistro: string): Promise<AuditoriaLog[]>
```

## 📊 **Estructura de Metadatos**

### **Interface AuditoriaMetadata**

```typescript
export interface AuditoriaMetadata {
  userId?: number;              // ID del usuario (null para procesos automáticos)
  ip?: string;                  // IP del request (solo HTTP)
  userAgent?: string;           // User agent (solo HTTP)
  correlationId?: string;       // ID de correlación (solo HTTP)
  timestamp: Date;              // Timestamp de la operación
  origen?: string;              // 'http', 'cron', 'import', 'worker', etc.
  isSystemGenerated?: boolean;  // true para procesos automáticos
  [key: string]: any;          // Campos adicionales personalizados
}
```

### **Ejemplos de Metadatos por Contexto**

#### **HTTP Request:**
```json
{
  "userId": 123,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "correlationId": "abc-123-def",
  "timestamp": "2024-01-15T10:30:00Z",
  "origen": "http"
}
```

#### **Import CSV:**
```json
{
  "userId": 456,
  "timestamp": "2024-01-15T10:30:00Z",
  "origen": "import_csv",
  "archivo": "productos_enero.csv",
  "totalRegistros": 500,
  "tipoImport": "productos_masivo"
}
```

#### **Cron Job:**
```json
{
  "userId": null,
  "timestamp": "2024-01-15T02:00:00Z",
  "origen": "cron_depreciacion",
  "isSystemGenerated": true,
  "porcentajeDepreciacion": 5,
  "productosAfectados": 120
}
```

#### **Background Worker:**
```json
{
  "userId": null,
  "timestamp": "2024-01-15T14:22:00Z",
  "origen": "worker_ajuste_stock",
  "isSystemGenerated": true,
  "jobId": "job_12345",
  "tipoAjuste": "entrada",
  "cantidad": 50
}
```

## ⚙️ **Configuración**

### **Variables de Entorno**

```bash
# Winston - Todas validadas por Zod en Módulo 1
WINSTON_MAX_FILES=14d              # Retener logs por 14 días
WINSTON_MAX_SIZE=20m               # Máximo 20MB por archivo
WINSTON_LOG_DIR=./logs             # Directorio de logs
WINSTON_CONSOLE_ENABLED=true       # Logs en consola (desarrollo)
WINSTON_FILE_ENABLED=auto          # Auto por NODE_ENV
WINSTON_DATE_PATTERN=YYYY-MM-DD    # Patrón de rotación
WINSTON_ERROR_FILE_ENABLED=true    # Archivo separado para errores
```

### **Configuración Automática por Ambiente**

- **Desarrollo**: Console logging, formato simple
- **Producción**: File logging, formato JSON, rotación automática
- **Testing**: Solo console, logs mínimos

## 📊 **Base de Datos**

### **Tabla de Auditoría**

```sql
-- Migración automática con Prisma
CREATE TABLE "auditoria_logs" (
  "id" SERIAL PRIMARY KEY,
  "tabla" TEXT NOT NULL,
  "id_registro" TEXT NOT NULL,
  "accion" TEXT NOT NULL, -- CREATE, UPDATE, DELETE, READ
  "valores_anteriores" JSONB,
  "valores_nuevos" JSONB,
  "usuario_id" INTEGER,
  "metadatos" JSONB,
  "fecha_creacion" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

-- Índices optimizados incluidos
CREATE INDEX "auditoria_logs_tabla_id_registro_idx" ON "auditoria_logs"("tabla", "id_registro");
CREATE INDEX "auditoria_logs_usuario_id_idx" ON "auditoria_logs"("usuario_id");
CREATE INDEX "auditoria_logs_fecha_creacion_idx" ON "auditoria_logs"("fecha_creacion");
```

## 🎭 **Decoradores Disponibles**

### **Decorador Principal**

```typescript
@Auditable({
  includeOldValues?: boolean;    // true - Incluir valores anteriores
  includeNewValues?: boolean;    // true - Incluir valores nuevos
  skipFields?: string[];         // ['password'] - Campos a omitir
  tableName?: string;           // 'usuarios' - Override tabla
  customMetadata?: object;      // { source: 'api' } - Metadata adicional
})
```

### **Decoradores Especializados**

```typescript
@AuditableCreate('usuarios')     // Solo para creación
@AuditableUpdate('usuarios')     // Para actualización con old/new values
@AuditableDelete('usuarios')     // Solo para eliminación con old values
@AuditableRead('usuarios')       // Para operaciones de lectura sensibles
```

## 🔍 **API de Consulta de Auditoría**

```typescript
// Inyectar AuditoriaService en cualquier lugar
constructor(private auditoria: AuditoriaService) {}

// Buscar por filtros
const logs = await this.auditoria.buscar({
  tabla: 'usuarios',
  usuarioId: 123,
  fechaDesde: new Date('2024-01-01'),
  accion: AuditoriaAction.UPDATE,
  limite: 50,
});

// Historial de un registro específico
const historial = await this.auditoria.buscarHistorial('usuarios', '123');

// Estadísticas de auditoría
const stats = await this.auditoria.obtenerEstadisticas();
```

## 🔒 **Seguridad y Sanitización**

### **Campos Sensibles Automáticamente Redactados**

```typescript
// Automáticamente redacta en logs y auditoría:
const SENSITIVE_FIELDS = [
  'password', 'token', 'secret', 'key', 
  'authorization', 'auth', 'credential', 'private'
];

// Resultado en logs:
{ 
  email: 'usuario@ejemplo.com',
  password: '[REDACTED]',  // ← Automático
  token: '[REDACTED]'      // ← Automático
}
```

## 🏢 **Casos de Uso Empresariales**

### **Sistema de Ventas**
- ✅ **HTTP**: Ventas creadas por usuarios via web
- ✅ **Manual**: Importación masiva de productos 
- ✅ **Automático**: Cálculo automático de comisiones

### **Sistema de Inventario**
- ✅ **HTTP**: Ajustes manuales de stock
- ✅ **Manual**: Migración de datos de otro sistema
- ✅ **Automático**: Depreciación automática, reorder points

### **Sistema Contable**
- ✅ **HTTP**: Asientos manuales por contadores
- ✅ **Manual**: Importación de facturas de proveedores
- ✅ **Automático**: Cierre automático de períodos, cálculo de impuestos

## ✅ **Criterios de Éxito**

- ✅ **Winston configurado** usando configuración validada del Módulo 1
- ✅ **API compatible** con Logger de NestJS (migración sin breaking changes)
- ✅ **Auditoría automática** funcionando con `@Auditable()`
- ✅ **Auditoría manual** para procesos internos y cron jobs
- ✅ **Sanitización** de campos sensibles automática
- ✅ **Rotación** de archivos según configuración
- ✅ **Formato por ambiente** (simple en dev, JSON en prod)
- ✅ **Performance** sin impacto significativo
- ✅ **Tabla auditoria_logs** funcionando con consultas optimizadas
- ✅ **Trazabilidad completa** en todos los contextos

---

**Módulo implementado para cubrir TODOS los escenarios de auditoría en sistemas empresariales complejos. ¡Listo para producción!** 🚀
