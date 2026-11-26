# Tareas Atómicas: Fase 1 Backend - Motor Completo de Campañas

## Grupo 1: Dominio y Puertos de Aplicación

- [x] **T1.1** Actualizar `src/campanas/domain/campaign.entity.ts` incorporando los invariantes puros de negocio (`isEditable()`, `isCancelable()`, `canModifyParticipants()`) y las propiedades de resumen de plantilla y métricas de participantes, manteniendo la pureza de dominio sin dependencias externas.
- [x] **T1.2** Crear las interfaces y DTOs internos de resultados en `src/campanas/application/` (`campaign-summary.result.ts`, `campaign-detail.result.ts`, `campaign-participant.result.ts`) para tipar estrictamente las salidas de los casos de uso.
- [x] **T1.3** Actualizar el puerto `CampaignRepositoryPort` en `src/campanas/application/campaign.repository.port.ts` declarando los contratos para lectura (`findSummary`, `findPaginated`, `findById`, `findParticipantsPaginated`), validación (`validateTemplateBelongsToCompanyOrGlobal`, `validateUsersBelongToCompany`, `findUserIdsByDepartmentIds`) y mutación (`create`, `update`, `addParticipants`, `removeParticipant`, `countParticipants`, `duplicate`, `cancel`).

---

## Grupo 2: Repositorio Prisma y Persistencia Multi-tenant

- [x] **T1.4** Implementar métodos de lectura en `src/campanas/infrastructure/prisma-campaign.repository.ts`:
  - `findSummary(companyId)`: Conteo agrupado por estado (`total`, `programadas`, `enCurso`, `finalizadas`, `canceladas`).
  - `findPaginated(companyId, params)`: Listado con filtros (`search`, `status`, `attackType`), paginación y mapeo de plantilla + total de participantes.
  - `findById(id, companyId)`: Detalle completo de campaña con plantilla asociada y conteo de participantes.
  - `findParticipantsPaginated(campaignId, companyId, params)`: Participantes paginados con búsqueda y filtro de departamento, omitiendo `token_rastreo` y `password_hash`.
- [x] **T1.5** Implementar métodos de soporte y validación en `PrismaCampaignRepository`:
  - `validateTemplateBelongsToCompanyOrGlobal(templateId, companyId)`: Comprueba que la plantilla pertenezca a la empresa o sea global (`empresa_id === null`).
  - `validateUsersBelongToCompany(userIds, companyId)`: Comprueba que todos los IDs pertenezcan a la empresa.
  - `findUserIdsByDepartmentIds(departmentIds, companyId)`: Resuelve y retorna los IDs de usuarios activos asignados a los departamentos indicados en el tenant.
- [x] **T1.6** Implementar operaciones de mutación con transacciones atómicas en `PrismaCampaignRepository`:
  - `create(companyId, data)`: `$transaction` creando la campaña e insertando en `campana_usuarios` con `token_rastreo` UUIDv4.
  - `update(id, companyId, data)`: Actualización de metadatos de campaña.
  - `addParticipants(campaignId, companyId, userIds)`: Inserción de nuevos colaboradores con `token_rastreo` UUIDv4 evitando duplicados.
  - `removeParticipant(campaignId, companyId, userId)`: Eliminación de colaborador en `campana_usuarios`.
  - `countParticipants(campaignId, companyId)`: Conteo actual de participantes.
  - `duplicate(id, companyId, newName, scheduledDate)`: Clonación atómica de campaña con nuevos tokens UUIDv4.
  - `cancel(id, companyId)`: Actualización de estado a `'cancelada'`.

---

## Grupo 3: Casos de Uso de la Aplicación

- [x] **T1.7** Implementar `GetCampaignSummaryUseCase` y actualizar `GetCampaignsUseCase` en `src/campanas/application/` aplicando `import type` en sus constructores.
- [x] **T1.8** Actualizar `GetCampaignByIdUseCase` e implementar `GetCampaignParticipantsUseCase` en `src/campanas/application/`, verificando la existencia de la campaña en el tenant y lanzando `NotFoundException` en caso contrario.
- [x] **T1.9** Actualizar `CreateCampaignUseCase` en `src/campanas/application/create-campaign.use-case.ts`:
  - Resolver usuarios tanto por `targetUserIds` como por `departmentIds`.
  - Deduplicar la lista y verificar que no quede vacía (`BadRequestException`).
  - Validar pertenencia multi-tenant de usuarios y plantilla.
  - Ejecutar creación atómica en el repositorio.
- [x] **T1.10** Implementar `UpdateCampaignUseCase` en `src/campanas/application/update-campaign.use-case.ts`:
  - Verificar pertenencia de la campaña al tenant (`NotFoundException`).
  - Validar invariante `isEditable()` rechazando con `BadRequestException` si no está `'programada'`.
  - Validar nueva plantilla si se actualiza `templateId`.
- [x] **T1.11** Implementar `ManageCampaignParticipantsUseCase` en `src/campanas/application/manage-campaign-participants.use-case.ts`:
  - Método `addParticipants`: Valida estado `'programada'`, resuelve usuarios del tenant e inserta omitiendo ya inscritos.
  - Método `removeParticipant`: Valida estado `'programada'`, comprueba que queden al menos 2 participantes antes de borrar (rechaza con `BadRequestException` si es el último) y elimina el registro.
- [x] **T1.12** Implementar `DuplicateCampaignUseCase` y actualizar `CancelCampaignUseCase` en `src/campanas/application/`:
  - `DuplicateCampaignUseCase`: Clona configuración y participantes con nuevo nombre y fecha.
  - `CancelCampaignUseCase`: Verifica pertenencia y valida invariante `isCancelable()` (solo `'programada'` o `'en_curso'`; `BadRequestException` en `'finalizada'` o `'cancelada'`).

---

## Grupo 4: DTOs, Controlador REST y Módulo

- [x] **T1.13** Crear/actualizar los DTOs de validación HTTP en `src/campanas/infrastructure/`:
  - `CreateCampaignDto`: Campos tipados, `@Type(() => Date)` para `scheduledDate`, `targetUserIds` y `departmentIds` opcionales con validación cruzada.
  - `UpdateCampaignDto`: Campos parciales opcionales (`name`, `templateId`, `scheduledDate`, `shippingMethod`).
  - `ManageParticipantsDto`: `targetUserIds` y `departmentIds` opcionales.
  - `DuplicateCampaignDto`: `name` opcional y `scheduledDate` obligatorio.
  - `GetCampaignsQueryDto`: Paginación, `search`, `status`, `attackType`.
  - `GetParticipantsQueryDto`: Paginación, `search`, `departmentId`.
- [x] **T1.14** Reorganizar y expandir `CampanasController` en `src/campanas/infrastructure/campanas.controller.ts` respetando el orden estricto de rutas:
  1. `GET /empresas/:empresaId/campanas/resumen` (antes de `:id`).
  2. `GET /empresas/:empresaId/campanas`.
  3. `GET /empresas/:empresaId/campanas/:id/participantes`.
  4. `GET /empresas/:empresaId/campanas/:id`.
  5. `POST /empresas/:empresaId/campanas`.
  6. `POST /empresas/:empresaId/campanas/:id/participantes`.
  7. `DELETE /empresas/:empresaId/campanas/:id/participantes/:usuarioId`.
  8. `POST /empresas/:empresaId/campanas/:id/duplicar`.
  9. `PATCH /empresas/:empresaId/campanas/:id/cancelar`.
  10. `PATCH /empresas/:empresaId/campanas/:id`.
- [x] **T1.15** Asegurar la aplicación de `@UseGuards(JwtAuthGuard, CompanyTenantGuard)`, `@ApiBearerAuth()`, decoradores Swagger exhaustivos (`@ApiOperation`, `@ApiResponse`, `@ApiProperty`) y pipes de validación (`ParseIntPipe`, `ParseUUIDPipe`) en todos los métodos del controlador.
- [x] **T1.16** Actualizar `src/campanas/campanas.module.ts` registrando todos los casos de uso, enlazando `CAMPAIGN_REPOSITORY` con `PrismaCampaignRepository`, e importando `PrismaModule` y `AuthModule`.

---

## Grupo 5: Verificación, Compilación y Contratos

- [x] **T1.17** Ejecutar `npm run build` en `phishwarden-backend-nj/` y confirmar compilación limpia con 0 errores de TypeScript y 0 errores de bundling.
- [x] **T1.18** Actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md` documentando todos los endpoints, contratos de payload JSON, query params, seguridad JWT multi-tenant y respuestas de Fase 1.
