# Tareas Atómicas: Fase 2.5 Backend - Portales Simulados Globales y Personalizados

## Grupo 1: Esquema de BD, Inserción de Portales Globales y Generación Prisma

- [x] **T2.5.1** Actualizar `phishwarden-backend/phishwarden.sql`:
  - Crear tabla `portales_simulados`.
  - Agregar columna `landing_id INT REFERENCES portales_simulados(id) ON DELETE SET NULL` en `plantillas`.
  - Actualizar restricción CHECK de `plantillas.landing_tipo` con `'unjbg'` y `'personalizado'`.
- [x] **T2.5.2** Ejecutar sentencia SQL contra la base de datos Supabase conectada (`npx prisma db execute`):
  - Crear tabla `portales_simulados` con sus constraints.
  - Insertar de manera idempotente los 5 portales globales (incluyendo `Aula Virtual UNJBG`).
  - Agregar columna `landing_id` a `plantillas`.
  - Actualizar CHECK de `landing_tipo` en `plantillas`.
- [x] **T2.5.3** Actualizar `phishwarden-backend-nj/prisma/schema.prisma` incorporando el modelo `portales_simulados`, la relación en `plantillas` y la relación en `empresas`.
- [x] **T2.5.4** Ejecutar `npx prisma generate` en `phishwarden-backend-nj/` para regenerar el cliente Prisma v5.

---

## Grupo 2: Módulo Hexagonal `src/portales/`

- [x] **T2.5.5** Crear `src/portales/domain/portal.entity.ts` con enum `PortalTipoBase` y entidad pura `PortalEntity`.
- [x] **T2.5.6** Crear `src/portales/application/portal.repository.port.ts` con el token `PORTAL_REPOSITORY_PORT` e interfaces de entrada/salida.
- [x] **T2.5.7** Implementar casos de uso en `src/portales/application/`:
  - `get-portals.use-case.ts`: Listar portales globales y de la empresa.
  - `get-portal-by-id.use-case.ts`: Obtener un portal validando aislamiento de tenant.
  - `create-portal.use-case.ts`: Crear portal personalizado asignado a la empresa.
  - `update-portal.use-case.ts`: Actualizar portal propio con blindaje 403 Forbidden para portales globales y ajenos.
  - `delete-portal.use-case.ts`: Eliminar portal propio con blindaje 403 Forbidden para portales globales y ajenos.
- [x] **T2.5.8** Crear DTOs en `src/portales/infrastructure/`:
  - `create-portal.dto.ts` con validaciones `class-validator` y decoradores Swagger.
  - `update-portal.dto.ts` con campos opcionales y decoradores Swagger.
- [x] **T2.5.9** Crear `src/portales/infrastructure/prisma-portal.repository.ts` implementando `PortalRepositoryPort`.
- [x] **T2.5.10** Crear `src/portales/infrastructure/portales.controller.ts` con Swagger y protecciones `JwtAuthGuard` + `CompanyTenantGuard`.
- [x] **T2.5.11** Crear `src/portales/portales.module.ts` y registrarlo en `src/app.module.ts`.

---

## Grupo 3: Integración en Módulo de Plantillas (`src/plantillas/`)

- [x] **T2.5.12** Actualizar `src/plantillas/domain/template.entity.ts`:
  - Soportar `'unjbg'` y `'personalizado'` en `LandingType`.
  - Añadir propiedad `landingId?: number | null` en `TemplateEntity`.
- [x] **T2.5.13** Actualizar DTOs `create-template.dto.ts` y `update-template.dto.ts` con `landingId?: number | null` y nuevo enum `LandingType`.
- [x] **T2.5.14** Actualizar `create-template.use-case.ts` y `update-template.use-case.ts` validando existencia y autorización de `landingId`.
- [x] **T2.5.15** Actualizar `src/plantillas/infrastructure/prisma-template.repository.ts` para persistir y mapear `landing_id`.
- [x] **T2.5.16** Actualizar `src/plantillas/plantillas.module.ts` importando `PortalesModule`.

---

## Grupo 4: Integración en Rastreo Público (`GET /track/context/:token`)

- [x] **T2.5.17** Actualizar `src/simulaciones/application/simulation-tracking.repository.port.ts` extendiendo `TrackingParticipantDetail` con `portalConfig` y `plantillaLandingId`.
- [x] **T2.5.18** Actualizar `src/simulaciones/infrastructure/prisma-simulation-tracking.repository.ts` resolviendo `portales_simulados` por `landing_id` o por fallback de `landing_tipo`.
- [x] **T2.5.19** Actualizar `src/simulaciones/application/get-simulation-context.use-case.ts` devolviendo `portalConfig` estructurado en la respuesta.

---

## Grupo 5: Contratos y Verificación

- [x] **T2.5.20** Actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md` documentando los endpoints `/empresas/:empresaId/portales` y la respuesta enriquecida de `GET /track/context/:token`.
- [x] **T2.5.21** Ejecutar `npm run build` en `phishwarden-backend-nj/` y verificar **0 errores de compilación de TypeScript**.
