# Tareas Atómicas: Fase 0 - Blindaje JWT y Multi-tenant

## Grupo 1: Configuración Global y Guard Multi-tenant Transversal

- [x] **T0.1** Actualizar `src/main.ts` habilitando `forbidNonWhitelisted: true` en el `ValidationPipe` global y agregar tags Swagger para módulos faltantes (`departamentos`, `plantillas`, `campanas`).
- [x] **T0.2** Crear el guard transversal `CompanyTenantGuard` en `src/auth/infrastructure/company-tenant.guard.ts` implementando validación de rol `administrador`, existencia de `empresaId` en token y comparación estricta con `request.params.empresaId` (HTTP 403 en caso de discrepancia).
- [x] **T0.3** Registrar y exportar `CompanyTenantGuard` en `src/auth/auth.module.ts`.

---

## Grupo 2: Blindaje del Módulo Departamentos

- [x] **T0.4** Modificar `src/departamentos/infrastructure/departamentos.controller.ts` para aplicar `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()`, documentando respuestas 401 y 403 en Swagger.
- [x] **T0.5** Verificar en `src/departamentos/infrastructure/prisma-department.repository.ts` que la eliminación use `deleteMany` con `{ id, empresa_id: companyId }` garantizando aislamiento estricto.

---

## Grupo 3: Blindaje del Módulo Empleados

- [x] **T0.6** Blindar `src/empleados/infrastructure/prisma-employee.repository.ts` en `updateEmployee` y `deleteEmployee` para restringir operaciones estrictamente por `empresa_id: companyId`, evitando ataques IDOR y modificación/eliminación cruzada entre empresas.
- [x] **T0.7** Verificar y asegurar el funcionamiento del filtro opcional `departmentId` en `findSummaryByCompany` dentro de `src/empleados/infrastructure/prisma-employee.repository.ts`.
- [x] **T0.8** Aplicar `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()` a nivel de clase en `src/empleados/infrastructure/empleados.controller.ts`, añadiendo respuestas Swagger 401 y 403.
- [x] **T0.9** Aplicar `ParseUUIDPipe` al parámetro `:id` en las rutas `PUT /empresas/:empresaId/empleados/:id` y `DELETE /empresas/:empresaId/empleados/:id` en `src/empleados/infrastructure/empleados.controller.ts`.
- [x] **T0.10** Aplicar `ParseUUIDPipe` al parámetro `:id` en `GET /empleados/:id` en `src/empleados/infrastructure/admin-empleados.controller.ts`.

---

## Grupo 4: Blindaje del Módulo Plantillas

- [x] **T0.11** Importar `AuthModule` en `src/plantillas/plantillas.module.ts` para habilitar el uso de guards.
- [x] **T0.12** Actualizar `src/plantillas/application/template.repository.port.ts` y `src/plantillas/infrastructure/prisma-template.repository.ts` para manejar IDs numéricos (`number`) y requerir validación de `companyId` en `update` y `delete`.
- [x] **T0.13** Modificar `src/plantillas/application/update-template.use-case.ts` para recibir `companyId: number` y `templateId: number`, validando con `ForbiddenException` que no se puedan modificar plantillas globales (`empresa_id = null`) ni plantillas de otra empresa (`empresa_id !== companyId`).
- [x] **T0.14** Modificar `src/plantillas/application/delete-template.use-case.ts` para recibir `companyId: number` y `templateId: number`, validando con `ForbiddenException` que no se puedan eliminar plantillas globales (`empresa_id = null`) ni plantillas de otra empresa (`empresa_id !== companyId`).
- [x] **T0.15** Proteger `src/plantillas/infrastructure/plantillas.controller.ts` con `@UseGuards(JwtAuthGuard, CompanyTenantGuard)`, `@ApiBearerAuth()`, respuestas Swagger 401/403, y agregar `ParseIntPipe` tanto en `empresaId` como en `id` para `PUT` y `DELETE`.

---

## Grupo 5: Bloqueo Preventivo del Módulo Campañas

- [x] **T0.16** Importar `AuthModule` en `src/campanas/campanas.module.ts`.
- [x] **T0.17** Proteger `src/campanas/infrastructure/campanas.controller.ts` con `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()` a nivel de clase, documentando respuestas 401/403 en Swagger.
- [x] **T0.18** Aplicar `ParseUUIDPipe` al parámetro `:id` en `GET /empresas/:empresaId/campanas/:id` y `PATCH /empresas/:empresaId/campanas/:id/cancelar` en `src/campanas/infrastructure/campanas.controller.ts`.

---

## Grupo 6: Verificación y Cierre de Contratos

- [x] **T0.19** Ejecutar `npm run build` en `phishwarden-backend-nj/` verificando 0 errores de compilación TypeScript y estricto uso de `import type` en interfaces inyectadas.
- [x] **T0.20** Actualizar `specs/API_CONTRACTS.md` con el estado final de las rutas blindadas, documentando los guards requeridos, headers `Authorization: Bearer <JWT>`, validadores de parámetros (`ParseIntPipe`, `ParseUUIDPipe`) y códigos de respuesta 401/403.
