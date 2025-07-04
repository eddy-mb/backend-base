# Sistema Base Individual

> Infraestructura base agnóstica al dominio para desarrollo rápido de sistemas individuales

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io/)

## 🎯 Descripción

Sistema Base Individual es una **infraestructura de código completa y reutilizable** diseñada para acelerar el desarrollo de sistemas empresariales, educativos, de salud y gubernamentales. Proporciona una base sólida, segura y escalable que reduce el tiempo de desarrollo inicial en un 60-70%.

### ✨ Características Principales

- 🏗️ **Arquitectura Modular**: 11 módulos independientes y reutilizables
- 🔒 **Seguridad Integrada**: Autenticación JWT, autorización RBAC, validación exhaustiva
- 📊 **Base de Datos Robusta**: PostgreSQL con auditoría completa y soft delete
- ⚡ **Alto Rendimiento**: Redis para cache y procesamiento asíncrono
- 📚 **Documentación Automática**: Swagger/OpenAPI integrado
- 🧪 **Testing Incluido**: Pruebas unitarias, integración y E2E
- 🐳 **Containerizado**: Docker y docker-compose para desarrollo
- 🎨 **Frontend Moderno**: Next.js 15 con TypeScript y Tailwind CSS

## 🛠️ Stack Tecnológico

### Backend

- **Framework**: NestJS con TypeScript
- **Base de Datos**: PostgreSQL 17 + Prisma ORM
- **Cache**: Redis 7
- **Seguridad**: JWT + Passport + bcryptjs
- **Validación**: class-validator + Zod
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston

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
npx prisma generate
npx prisma db push

# 6. Iniciar el servidor de desarrollo
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
│   │   └── configuracion/     # ✅ Módulo 1 - Configuración del Sistema
│   │       ├── controllers/   # Controladores REST
│   │       ├── services/      # Lógica de negocio
│   │       ├── guards/        # Guards de seguridad
│   │       ├── interfaces/    # Tipos TypeScript
│   │       ├── schemas/       # Validación Zod
│   │       └── tests/         # Pruebas unitarias
│   ├── common/               # Utilidades compartidas
│   ├── config/               # Configuraciones
│   └── main.ts              # Punto de entrada
├── prisma/                  # Schema y migraciones
├── test/                    # Pruebas E2E
├── docker-compose.yml       # Servicios de desarrollo
└── package.json
```

## 🏗️ Módulos de Infraestructura

### ✅ Implementados

#### **Módulo 1: Configuración del Sistema**

- ✅ Gestión centralizada de variables de entorno
- ✅ Validación con Zod de configuraciones críticas
- ✅ Health checks y diagnósticos del sistema
- ✅ Endpoints de administración con seguridad
- ✅ Documentación Swagger completa

### 🚧 En Desarrollo

#### **Fase 1: Infraestructura Técnica**

- [ ] **Módulo 2**: Base de Datos y Entidades - Prisma ORM y auditoría
- [ ] **Módulo 3**: Respuestas Estandarizadas - DTOs y manejo de errores
- [ ] **Módulo 4**: Observabilidad - Logging y monitoreo

#### **Fase 2: Seguridad y Acceso**

- [ ] **Módulo 5**: Autenticación - NextAuth.js + JWT
- [ ] **Módulo 6**: Autorización - RBAC con Casbin
- [ ] **Módulo 7**: Gestión de Usuarios - CRUD completo

#### **Fase 3: Servicios de Aplicación**

- [ ] **Módulo 8**: Configuración General - Settings de aplicación
- [ ] **Módulo 9**: Gestión de Archivos - Upload y almacenamiento
- [ ] **Módulo 10**: Sistema de Comunicaciones - Emails y notificaciones
- [ ] **Módulo 11**: Exportación y Reportes - PDF y Excel

## 📚 API Endpoints

### Sistema (Módulo 1)

| Método | Endpoint                                | Descripción               | Autenticación |
| ------ | --------------------------------------- | ------------------------- | ------------- |
| `GET`  | `/api/v1/sistema/health`                | Estado del sistema        | No            |
| `GET`  | `/api/v1/sistema/info`                  | Información básica        | No            |
| `GET`  | `/api/v1/sistema/configuracion`         | Configuración del sistema | Admin         |
| `POST` | `/api/v1/sistema/validar-configuracion` | Validar configuración     | Admin         |
| `GET`  | `/api/v1/sistema/conectividad`          | Estado de servicios       | Admin         |

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

- **PostgreSQL**: Puerto 5432
- **Redis**: Puerto 6379

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

# Base de Datos
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema_base_db"

# Redis
REDIS_URL="redis://:redis@localhost:6379"

# Seguridad
JWT_SECRET="tu-jwt-secret-de-32-caracteres-minimo"
ENCRYPTION_KEY="tu-encryption-key-de-32-caracteres"

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

Ver `.env.example` para la configuración completa.

## 🔒 Seguridad

### Características Implementadas

- ✅ **Validación de entrada**: class-validator en todos los DTOs
- ✅ **Sanitización**: Limpieza automática de datos
- ✅ **Headers de seguridad**: Helmet.js integrado
- ✅ **CORS configurado**: Orígenes permitidos controlados
- ✅ **Rate limiting**: Protección contra ataques de fuerza bruta
- ✅ **Secrets seguros**: Generación con OpenSSL
- ✅ **Validación de configuración**: Zod para variables críticas

### Próximas Implementaciones

- 🚧 **Autenticación JWT**: Módulo 5
- 🚧 **Autorización RBAC**: Módulo 6
- 🚧 **Auditoría completa**: Módulo 2
- 🚧 **Encriptación de datos**: Módulos 5-7

## 📊 Monitoreo y Observabilidad

### Health Checks

El sistema incluye endpoints de salud que verifican:

- ✅ Estado de la base de datos PostgreSQL
- ✅ Conectividad con Redis
- ✅ Estado de servicios externos (email, storage)
- ✅ Validación de configuración completa

### Logging

- **Niveles**: error, warn, info, debug
- **Estructura**: JSON estructurado
- **Rotación**: Archivos diarios
- **Contexto**: Request ID y usuario

## 🤝 Contribución

### Estándares de Código

- **TypeScript**: Tipado estricto habilitado
- **ESLint**: Linting automático
- **Prettier**: Formateo consistente
- **Conventional Commits**: Mensajes de commit estandarizados
- **Husky**: Git hooks para calidad

### Scripts de Desarrollo

```bash
# Desarrollo
npm run start:dev          # Servidor en modo watch
npm run lint              # Ejecutar linter
npm run format            # Formatear código

# Base de datos
npm run db:generate       # Generar cliente Prisma
npm run db:migrate        # Ejecutar migraciones
npm run db:seed          # Ejecutar seeders
npm run db:studio        # Abrir Prisma Studio

# Testing
npm run test             # Pruebas unitarias
npm run test:e2e         # Pruebas end-to-end
npm run test:cov         # Cobertura de código
```

## 🎯 Casos de Uso

### Sistemas Empresariales

- CRM y ERP
- Gestión de recursos humanos
- Plataformas de comercio electrónico
- Sistemas de inventario

### Aplicaciones Educativas

- Plataformas de aprendizaje (LMS)
- Sistemas de gestión académica
- Herramientas educativas

### Sistemas de Salud

- Gestión de pacientes
- Sistemas de citas médicas
- Plataformas de telemedicina

### Aplicaciones Gubernamentales

- Sistemas de trámites ciudadanos
- Plataformas de transparencia
- Gestión administrativa

### Organizaciones sin Fines de Lucro

- Gestión de donaciones
- Sistemas de voluntariado
- Plataformas de impacto social

## 📈 Roadmap

### Q1 2025

- ✅ Módulo 1: Configuración del Sistema
- 🚧 Módulo 2: Base de Datos y Entidades
- 🚧 Módulo 3: Respuestas Estandarizadas
- 🚧 Módulo 4: Observabilidad

### Q2 2025

- 📅 Módulo 5: Autenticación
- 📅 Módulo 6: Autorización
- 📅 Módulo 7: Gestión de Usuarios
- 📅 Frontend Next.js 15

### Q3 2025

- 📅 Módulo 8: Configuración General
- 📅 Módulo 9: Gestión de Archivos
- 📅 Módulo 10: Sistema de Comunicaciones
- 📅 Módulo 11: Exportación y Reportes

### Q4 2025

- 📅 Documentación completa
- 📅 Templates de proyectos
- 📅 CLI para generación automática
- 📅 Marketplace de módulos adicionales

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- **NestJS Team** - Por el increíble framework
- **Prisma Team** - Por la mejor experiencia de ORM
- **Vercel** - Por Next.js y la inspiración en DX
- **Comunidad Open Source** - Por las herramientas que hacen esto posible

---

<div align="center">

**Hecho con ❤️ para acelerar el desarrollo de software**

</div>
