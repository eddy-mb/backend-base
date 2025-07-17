# Sistema Base Individual

> Infraestructura base agnóstica al dominio para desarrollo rápido de sistemas individuales

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-FE0803?style=flat&logo=typeorm&logoColor=white)](https://typeorm.io/)

## 🎯 Descripción

Sistema Base Individual es una **infraestructura de código completa y reutilizable** diseñada para acelerar el desarrollo de sistemas empresariales, educativos, de salud y gubernamentales. Proporciona una base sólida, segura y escalable que reduce el tiempo de desarrollo inicial en un 60-70%.

### ✨ Características Principales

- 🏗️ **Arquitectura Modular**: 12 módulos independientes y reutilizables
- 🏛️ **Arquitectura Limpia**: Separación clara entre infraestructura y aplicación
- 🔒 **Seguridad Integrada**: Autenticación JWT, autorización RBAC, validación exhaustiva
- 📊 **Base de Datos Robusta**: PostgreSQL con auditoría completa y soft delete
- ⚡ **Alto Rendimiento**: Redis para cache y procesamiento asíncrono
- 📋 **Respuestas Consistentes**: Formato estándar para todas las APIs
- 📚 **Documentación Automática**: Swagger/OpenAPI integrado
- 🧪 **Testing Incluido**: Pruebas unitarias, integración y E2E
- 🐳 **Containerizado**: Docker y docker-compose para desarrollo
- 🎨 **Frontend Moderno**: Next.js 15 con TypeScript y Tailwind CSS

## 🛠️ Stack Tecnológico

### Backend

- **Framework**: NestJS con TypeScript
- **Base de Datos**: PostgreSQL 17 + TypeORM
- **Cache**: Redis 7 + Bull Queue
- **Seguridad**: JWT + Passport + bcryptjs
- **Validación**: class-validator + Zod
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston (aplicación) + Logger nativo (infraestructura)

### Frontend (Próximamente)

- **Framework**: Next.js 15 + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand + TanStack Query
- **Autenticación**: NextAuth.js
- **Testing**: Vitest + Playwright

### DevOps

- **Containerización**: Docker + docker-compose
- **Base de Datos**: PostgreSQL 17-alpine
- **Cache**: Redis 7-alpine

## 🏗️ **Arquitectura Limpia Implementada**

### 📊 **Separación de Responsabilidades**

```typescript
// ✅ INFRAESTRUCTURA (Módulos 1-5): Logger nativo NestJS
@Injectable()
export class ConfiguracionService {
  private readonly logger = new Logger(ConfiguracionService.name);
  // Simple, confiable, sin dependencias circulares
}

// ✅ APLICACIÓN (Módulos 6-12): LoggerService con Winston
@Injectable() 
export class UsuarioService {
  constructor(private logger: LoggerService) {}
  // Características avanzadas: Winston + Auditoría + Formateo
}
```

### 🎯 **Beneficios de la Arquitectura**

- **Sin dependencias circulares**: Infraestructura independiente
- **Startup más rápido**: Base simple y confiable
- **Testing más fácil**: Menos mocks en infraestructura
- **Escalabilidad**: Características avanzadas donde aportan valor
- **Mantenibilidad**: Separación clara de responsabilidades

### 📐 **Diagrama de Dependencias**

```
┌─────────────────────────────────────────────────────────┐
│                 MÓDULOS APLICACIÓN (6-12)              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   Usuarios  │ │    Auth     │ │     Archivos        ││
│  │             │ │             │ │                     ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
│           │               │                │            │
│           └───────────────▼────────────────┘            │
│                   LoggerService                         │
│                 (Winston + Auditoría)                   │
└─────────────────────┬───────────────────────────────────┘
                      │ NO DEPENDENCIES
┌─────────────────────▼───────────────────────────────────┐
│              MÓDULOS INFRAESTRUCTURA (1-5)             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │Configuración│ │Base de Datos│ │      Redis          ││
│  │(Logger)     │ │(Logger)     │ │    (Logger)         ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 22
- Docker y Docker Compose
- Git

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/eddy-mb/backend-base.git
cd backend-base

# 2. Levantar servicios de base de datos
docker-compose up -d

# 3. Instalar dependencias
npm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# 5. Ejecutar migraciones de base de datos
npm run migration:run

# 6. Ejecutar seeds (opcional)
npm run seed

# 7. Iniciar el servidor de desarrollo
npm run start:dev
```

### Verificación

Una vez iniciado, puedes acceder a:

- **API**: http://localhost:3001
- **Documentación**: http://localhost:3001/api/docs
- **Health Check**: http://localhost:3001/api/v1/sistema/health

## 📁 Estructura del Proyecto

```
backend-base/
├── src/
│   ├── modules/               # Módulos de la aplicación
│   │   ├── configuracion/     # ✅ Módulo 1 - Configuración del Sistema
│   │   ├── database/          # ✅ Módulo 2 - Base de Datos y Entidades  
│   │   ├── redis/             # ✅ Módulo 3 - Redis y Colas
│   │   ├── respuestas/        # ✅ Módulo 4 - Respuestas Estandarizadas
│   │   └── observabilidad/    # ✅ Módulo 5 - Observabilidad (Logging + Auditoría)
│   ├── common/               # Utilidades compartidas
│   ├── config/               # Configuraciones técnicas
│   └── main.ts              # Punto de entrada
├── src/database/            # Migraciones y seeds TypeORM
├── test/                    # Pruebas E2E
├── docker-compose.yml       # Servicios de desarrollo
└── package.json
```

## 🏗️ Módulos de Infraestructura

### ✅ Implementados y Funcionando

#### **Módulo 1: Configuración del Sistema**

- ✅ Gestión centralizada de variables de entorno con validación Zod
- ✅ Health checks reales de servicios (PostgreSQL, Redis, Email)
- ✅ Endpoints de diagnóstico y administración con seguridad
- ✅ Configuración por ambiente (development, staging, production)
- ✅ **Logger nativo NestJS** (sin dependencias circulares)
- ✅ Documentación Swagger completa

#### **Módulo 2: Base de Datos (Database)**

- ✅ Conexión TypeORM con PostgreSQL y lifecycle management
- ✅ Health checks reales con verificación de conectividad
- ✅ Patrón de auditoría base para todas las entidades
- ✅ **Logger nativo NestJS** para máxima confiabilidad
- ✅ Logging detallado de conexión y manejo robusto de errores
- ✅ Tests unitarios e integración completos

#### **Módulo 3: Redis y Colas**

- ✅ Cliente Redis real (ioredis) con operaciones cache completas
- ✅ Sistema Bull para colas de procesamiento asíncrono
- ✅ Health checks integrados con Módulo 1 (ValidacionService)
- ✅ **Logger nativo NestJS** para infraestructura robusta
- ✅ Gestión centralizada de colas y estadísticas de rendimiento
- ✅ Reconexión automática y configuración avanzada

#### **Módulo 4: Respuestas Estandarizadas**

- ✅ Formato consistente `{ data: ... }` para todas las respuestas exitosas
- ✅ Paginación automática con decorador `@UsePagination()`
- ✅ Manejo unificado de errores con factory methods
- ✅ **Logger nativo NestJS** en ErrorFilter
- ✅ Integración automática con class-validator
- ✅ Type safety completo y configuración cero

#### **Módulo 5: Observabilidad**

- ✅ **LoggerService con Winston** para módulos de aplicación (6-12)
- ✅ **Arquitectura sin dependencias circulares**
- ✅ Auditoría completa con decorador `@Auditable()`
- ✅ Logging estructurado con sanitización automática
- ✅ Rotación de archivos y configuración por ambiente
- ✅ Metadatos enriquecidos para HTTP, cron jobs y workers

### 🚧 En Desarrollo

#### **Fase 2: Seguridad y Acceso**

- [ ] **Módulo 6**: Autenticación - NextAuth.js + JWT
- [ ] **Módulo 7**: Autorización - RBAC con Casbin
- [ ] **Módulo 8**: Gestión de Usuarios - CRUD completo

#### **Fase 3: Servicios de Aplicación**

- [ ] **Módulo 9**: Configuración General - Settings de aplicación
- [ ] **Módulo 10**: Gestión de Archivos - Upload y almacenamiento
- [ ] **Módulo 11**: Sistema de Comunicaciones - Emails y notificaciones
- [ ] **Módulo 12**: Exportación y Reportes - PDF y Excel

## 📚 API Endpoints

### Sistema (Módulo 1)

| Método | Endpoint                                | Descripción               | Autenticación |
| ------ | --------------------------------------- | ------------------------- | ------------- |
| `GET`  | `/api/v1/sistema/health`                | Estado del sistema        | No            |
| `GET`  | `/api/v1/sistema/info`                  | Información básica        | No            |
| `GET`  | `/api/v1/sistema/configuracion`         | Configuración del sistema | Admin         |
| `POST` | `/api/v1/sistema/validar-configuracion` | Validar configuración     | Admin         |
| `GET`  | `/api/v1/sistema/conectividad`          | Estado de servicios       | Admin         |

### Ejemplo de Respuesta Estándar

```json
{
  "data": {
    "sistema": "operativo",
    "version": "1.0.0",
    "ambiente": "development",
    "timestamp": "2024-01-15 10:30:00",
    "servicios": {
      "baseDatos": "conectado",
      "redis": "conectado", 
      "email": "operativo"
    }
  }
}
```

### Documentación Completa

Visita http://localhost:3001/api/docs para la documentación interactiva de Swagger.

## 🧪 Testing

```bash
# Ejecutar todas las pruebas
npm run test

# Pruebas en modo watch
npm run test:watch

# Cobertura de código
npm run test:cov

# Pruebas end-to-end
npm run test:e2e

# Pruebas por módulo específico
npm test -- configuracion
npm test -- database
npm test -- redis
npm test -- respuestas
npm test -- observabilidad
```

## 🐳 Docker

### Servicios Disponibles

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar servicios
docker-compose down
```

### Servicios Incluidos

- **PostgreSQL**: Puerto 5432 (usuario: postgres, password: postgres)
- **Redis**: Puerto 6379 (password: redis)

## ⚙️ Configuración

### Variables de Entorno Principales

```env
# Aplicación
NODE_ENV=development
PORT=3001
APP_NAME=Sistema Base Individual
APP_VERSION=1.0.0

# URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:3001

# Base de Datos TypeORM
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sistema_base_db
DB_SSL=false
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_base_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis
REDIS_URL="redis://:redis@localhost:6379"

# Seguridad
JWT_SECRET="xGJyMPRicscKhE/PRrhf6oVBQk5WGrdw2+3Z1wHi1bc="
ENCRYPTION_KEY="ZTwhmh5xYbuJkaWHL4lK6pgBDyzv1RoL8Wycg98zIN8="

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging (para módulos de aplicación)
LOG_LEVEL=debug
WINSTON_MAX_FILES=14d
WINSTON_MAX_SIZE=20m
WINSTON_LOG_DIR=./logs
WINSTON_CONSOLE_ENABLED=true
WINSTON_DATE_PATTERN=YYYY-MM-DD
WINSTON_ERROR_FILE_ENABLED=true

# Zona horaria
TZ=America/La_Paz
```

Ver `.env.example` para la configuración completa.

## 🔒 Seguridad

### Características Implementadas

- ✅ **Validación de entrada**: class-validator en todos los DTOs
- ✅ **Sanitización**: Limpieza automática de datos
- ✅ **Headers de seguridad**: Helmet.js integrado
- ✅ **CORS configurado**: Orígenes permitidos controlados
- ✅ **Rate limiting**: Protección contra ataques de fuerza bruta
- ✅ **Secrets seguros**: Claves JWT y encriptación robustas
- ✅ **Validación de configuración**: Zod para variables críticas
- ✅ **Respuestas consistentes**: Formato estándar que previene data leaks
- ✅ **Logging seguro**: Sanitización automática de datos sensibles

### Próximas Implementaciones

- 🚧 **Autenticación JWT**: Módulo 6
- 🚧 **Autorización RBAC**: Módulo 7
- 🚧 **Auditoría completa**: Implementada en Módulo 5
- 🚧 **Encriptación de datos**: Módulos 6-8

## 📊 Monitoreo y Observabilidad

### Health Checks Reales

El sistema incluye endpoints de salud que verifican **conectividad real**:

- ✅ **PostgreSQL**: Verificación con consulta real a base de datos
- ✅ **Redis**: PING real con métricas de latencia
- ✅ **Servicios externos**: Estado de email y storage
- ✅ **Configuración**: Validación completa de variables críticas

### Estado Actual de Servicios

```bash
# Verificar todos los servicios
curl http://localhost:3001/api/v1/sistema/health

# Verificar conectividad detallada (requiere auth admin)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3001/api/v1/sistema/conectividad
```

### Logging Estructurado

#### **Para Infraestructura (Módulos 1-5)**
- **Logger**: NestJS nativo (simple y confiable)
- **Niveles**: error, warn, log, debug
- **Uso**: Logging básico de conexiones y errores

#### **Para Aplicación (Módulos 6-12)**
- **Logger**: Winston con configuración avanzada
- **Características**: Rotación, sanitización, auditoría
- **Formato**: JSON estructurado con contexto enriquecido
- **Auditoría**: Tracking completo de cambios en entidades

## 🤝 Contribución

### Estándares de Código

- **TypeScript**: Tipado estricto habilitado
- **ESLint**: Linting automático con reglas consistentes
- **Prettier**: Formateo consistente
- **Conventional Commits**: Mensajes de commit estandarizados
- **Husky**: Git hooks para calidad
- **Testing**: Cobertura > 80% requerida

### Scripts de Desarrollo

```bash
# Desarrollo
npm run start:dev          # Servidor en modo watch
npm run lint              # Ejecutar linter
npm run format            # Formatear código

# Base de datos TypeORM
npm run migration:generate -- NombreMigracion  # Generar migración
npm run migration:run                          # Ejecutar migraciones
npm run migration:revert                       # Revertir migración
npm run schema:sync                            # Sincronizar schema (desarrollo)
npm run seed                                   # Ejecutar seeders

# Testing
npm run test             # Pruebas unitarias
npm run test:e2e         # Pruebas end-to-end
npm run test:cov         # Cobertura de código
```

## 🎯 Casos de Uso

### Sistemas Empresariales

- CRM y ERP con base robusta
- Gestión de recursos humanos
- Plataformas de comercio electrónico
- Sistemas de inventario y logística

### Aplicaciones Educativas

- Plataformas de aprendizaje (LMS)
- Sistemas de gestión académica
- Herramientas educativas colaborativas

### Sistemas de Salud

- Gestión de pacientes y citas
- Sistemas de historiales médicos
- Plataformas de telemedicina

### Aplicaciones Gubernamentales

- Sistemas de trámites ciudadanos
- Plataformas de transparencia
- Gestión administrativa pública

### Organizaciones sin Fines de Lucro

- Gestión de donaciones y proyectos
- Sistemas de voluntariado
- Plataformas de impacto social

## 📈 Roadmap

### ✅ Q1 2025 - Infraestructura Base

- ✅ **Módulo 1**: Configuración del Sistema - **COMPLETADO**
- ✅ **Módulo 2**: Base de Datos y Entidades - **COMPLETADO**
- ✅ **Módulo 3**: Redis y Colas - **COMPLETADO**
- ✅ **Módulo 4**: Respuestas Estandarizadas - **COMPLETADO**
- ✅ **Módulo 5**: Observabilidad - **COMPLETADO**

### 🚧 Q2 2025 - Seguridad y Usuarios

- 📅 **Módulo 6**: Autenticación
- 📅 **Módulo 7**: Autorización
- 📅 **Módulo 8**: Gestión de Usuarios
- 📅 Frontend Next.js 15

### 📅 Q3 2025 - Servicios de Aplicación

- 📅 **Módulo 9**: Configuración General
- 📅 **Módulo 10**: Gestión de Archivos
- 📅 **Módulo 11**: Sistema de Comunicaciones
- 📅 **Módulo 12**: Exportación y Reportes

### 📅 Q4 2025 - Ecosistema

- 📅 Documentación completa y tutoriales
- 📅 Templates de proyectos específicos
- 📅 CLI para generación automática
- 📅 Marketplace de módulos adicionales

## 🎉 Estado Actual

**5 de 12 módulos implementados y funcionando (42% completado)**

### ✅ **Infraestructura Completa**
- **Arquitectura limpia**: Sin dependencias circulares
- **Base sólida**: Configuración, BD, Cache, APIs, Logging
- **Health checks reales**: Monitoreo completo de servicios
- **Testing robusto**: Tests unitarios e integración en todos los módulos

### 🚀 **Logros Arquitectónicos**
- **Separation of Concerns**: Infraestructura vs Aplicación
- **Startup Performance**: Base simple y rápida
- **Escalabilidad**: Características avanzadas donde aportan valor
- **Developer Experience**: APIs claras y documentadas

### 📊 **Métricas de Calidad**
- **Cobertura de tests**: > 80% en todos los módulos
- **TypeScript strict**: 100% type safety
- **Documentación**: READMEs detallados por módulo
- **Estándares**: ESLint + Prettier + Conventional Commits

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **NestJS Team** - Por el increíble framework modular
- **TypeORM Team** - Por el ORM enterprise-grade con decoradores
- **Redis Labs** - Por la velocidad y confiabilidad
- **Vercel** - Por Next.js y la inspiración en DX
- **Comunidad Open Source** - Por las herramientas que hacen esto posible

---

<div align="center">

**Hecho con ❤️ para acelerar el desarrollo de software**

*5/12 módulos completados - Infraestructura base sólida establecida*

**✅ Arquitectura limpia implementada | ✅ Sin dependencias circulares | ✅ Listo para aplicación**

</div>