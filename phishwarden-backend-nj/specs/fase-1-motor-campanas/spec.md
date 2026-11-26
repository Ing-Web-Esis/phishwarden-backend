# Fase 1 Backend - Motor Completo de Campañas (`campanas` y `campana_usuarios`)

## Objetivo

Auditar, blindar y completar el módulo `campanas` bajo la arquitectura Hexagonal y las reglas multi-tenant de `specs/CONSTITUTION.md`, dotándolo de todos los endpoints administrativos necesarios para gestionar el ciclo de vida completo de una campaña antes de su ejecución: creación atómica (por usuarios individuales o departamentos completos), consulta paginada, resumen ejecutivo de estados, detalle con participantes paginados, edición previa al inicio, gestión de objetivos, clonación y cancelación segura.

## Alcance

### Incluido

1. Consolidación de `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()` a nivel de `CampanasController`.
2. **Endpoints de lectura y métricas rápidas:**
   - `GET /empresas/:empresaId/campanas/resumen` (contadores por estado para tarjetas KPI del módulo).
   - `GET /empresas/:empresaId/campanas` (listado paginado con filtros por texto, estado y tipo de ataque).
   - `GET /empresas/:empresaId/campanas/:id` (detalle general de la campaña y plantilla asociada).
   - `GET /empresas/:empresaId/campanas/:id/participantes` (listado paginado y buscable de colaboradores asignados en `campana_usuarios`).
3. **Endpoints de creación, edición y ciclo de vida:**
   - `POST /empresas/:empresaId/campanas` (creación atómica aceptando `targetUserIds` UUIDv4[] y/o `departmentIds` INT[], generando `token_rastreo` UUIDv4 únicos en `campana_usuarios`).
   - `PATCH /empresas/:empresaId/campanas/:id` (edición de metadatos permitida **solo** en estado `'programada'`).
   - `POST /empresas/:empresaId/campanas/:id/participantes` (agregar colaboradores o departamentos adicionales mientras la campaña esté `'programada'`).
   - `DELETE /empresas/:empresaId/campanas/:id/participantes/:usuarioId` (remover un colaborador objetivo mientras la campaña esté `'programada'`).
   - `POST /empresas/:empresaId/campanas/:id/duplicar` (clonar campaña existente a una nueva campaña `'programada'` con nuevos `token_rastreo` UUIDv4).
   - `PATCH /empresas/:empresaId/campanas/:id/cancelar` (cancelar campaña desde `'programada'` o `'en_curso'`).
4. Validación estricta de tipos de identificadores (`ParseIntPipe` / `@IsInt()` para `empresaId`, `templateId`, `departmentIds`; `ParseUUIDPipe` / `@IsUUID('4')` para `campanas.id`, `usuarioId`, `targetUserIds`).
5. Documentación completa en Swagger y actualización de `specs/API_CONTRACTS.md`.

### Excluido

- Despacho automático de correos/SMS y tareas programadas (Cron/Scheduler) — corresponde a Fase 2.
- Endpoints públicos de rastreo (`/track/open`, `/track/click`, `/track/submit`) y tabla `eventos_simulacion` — corresponde a Fase 2.
- Notificaciones push móviles (FCM) — corresponde a Fase 3.
- Analítica profunda de conversión o mapas de calor — corresponde a Fase 5.

## Estado inicial requerido por la auditoría

- `CampanasController` cuenta con `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` aplicado en Fase 0.
- Existen endpoints iniciales (`GET`, `GET /:id`, `POST`, `PATCH /:id/cancelar`) que deben auditarse para asegurar filtros estrictos por `empresa_id` en el repositorio Prisma y ampliar sus capacidades según esta especificación.
- Verificar los nombres exactos de columnas y relaciones de `campanas` y `campana_usuarios` en `prisma/schema.prisma` antes de implementar consultas.

## Reglas funcionales

1. **Orden de Rutas en el Controlador (Regla Crítica de NestJS):**
   - La ruta estática `GET /empresas/:empresaId/campanas/resumen` **debe declararse antes** que `GET /empresas/:empresaId/campanas/:id` para evitar que NestJS interprete `"resumen"` como un parámetro `:id` y dispare un error 400 en `ParseUUIDPipe`.

2. **Resumen de Campañas (`GET /empresas/:empresaId/campanas/resumen`):**
   - Devuelve los totales pertenecientes exclusivamente a `empresa_id = empresaId`:
     `{ total, programadas, enCurso, finalizadas, canceladas }`.

3. **Listado Paginado (`GET /empresas/:empresaId/campanas`):**
   - Query params: `page` (INT, default 1), `limit` (INT, default 10), `search` (busca por nombre de campaña), `status` (`'programada' | 'en_curso' | 'finalizada' | 'cancelada'`), `attackType` (`'phishing' | 'smishing'` o equivalente mapeado de la plantilla).
   - Respuesta estándar `{ data, total, page, limit }`, incluyendo por cada campaña: `id`, `nombre`, `fechaProgramada`, `modalidadEnvio`, `estado`, resumen de plantilla (`id`, `titulo`, `metodoAtaque`) y `totalParticipantes`.

4. **Detalle de Campaña y Participantes Paginados:**
   - `GET /empresas/:empresaId/campanas/:id`: Filtra por `{ id, empresa_id: empresaId }`. Si no existe o pertenece a otra empresa, responde `404 Not Found`. Devuelve los datos completos de la campaña, la plantilla asociada y el conteo total de participantes.
   - `GET /empresas/:empresaId/campanas/:id/participantes`: Verifica que la campaña pertenezca a `empresaId` (`404` si no existe) y devuelve `{ data, total, page, limit }` de `campana_usuarios` (soportando `search` por nombre/correo y `departmentId` INT), exponiendo `usuarioId`, `nombre`, `correo`, `departamento` y estado de participación. **Nunca** exponer `password_hash` ni `token_rastreo` en el listado administrativo.

5. **Creación Atómica (`POST /empresas/:empresaId/campanas`):**
   - Payload: `name` (string), `templateId` (INT), `scheduledDate` (ISO 8601 `Date`), `shippingMethod` (`'masivo' | 'escalonado'`), `targetUserIds` (`UUIDv4[]`, opcional), `departmentIds` (`INT[]`, opcional).
   - **Validación de objetivos:** Debe enviarse al menos uno entre `targetUserIds` o `departmentIds`.
     - Si se envía `templateId`, verificar que exista y pertenezca a `empresaId` o sea global (`empresa_id === null`); de lo contrario `404` o `403`.
     - Si se envía `departmentIds`, verificar que todos pertenezcan a `empresaId` (`400` si alguno no pertenece) y resolver sus usuarios activos.
     - Si se envía `targetUserIds`, verificar que todos pertenezcan a `empresaId` (`400` si alguno no pertenece).
     - Consolidar y deduplicar la lista final de `usuario_id`. Si la lista resultante queda vacía (por ejemplo, departamentos sin empleados), rechazar con `400 Bad Request`.
   - **Transacción Atómica (`$transaction`):** Crea la campaña con `estado = 'programada'` e inserta los registros en `campana_usuarios` con `token_rastreo` único (`UUIDv4`) por cada colaborador.

6. **Edición de Campaña (`PATCH /empresas/:empresaId/campanas/:id`):**
   - Payload parcial opcional: `name`, `templateId`, `scheduledDate`, `shippingMethod`.
   - Verificar que la campaña exista y pertenezca a `empresaId` (`404` si no).
   - **Invariante de estado:** Solo editable si `estado === 'programada'`. Si está en `'en_curso'`, `'finalizada'` o `'cancelada'`, rechazar con `400 Bad Request`.
   - Si se actualiza `templateId`, validar nuevamente que exista y sea global o del mismo `empresaId`.

7. **Gestión de Participantes en Campaña Programada:**
   - `POST /empresas/:empresaId/campanas/:id/participantes`: Acepta `{ targetUserIds?: string[], departmentIds?: number[] }`. Valida que la campaña sea de `empresaId` y esté en estado `'programada'` (`400` en otro estado). Resuelve y valida usuarios del tenant, ignora los que ya estén inscritos en esa campaña e inserta los nuevos con su `token_rastreo` UUIDv4. Devuelve el conteo de agregados.
   - `DELETE /empresas/:empresaId/campanas/:id/participantes/:usuarioId`: Valida `id` y `usuarioId` con `ParseUUIDPipe`, verifica pertenencia al tenant y estado `'programada'`, y elimina el registro de `campana_usuarios` (exigiendo que quede al menos 1 participante en la campaña; si es el último, rechazar con `400 Bad Request`).

8. **Clonación de Campaña (`POST /empresas/:empresaId/campanas/:id/duplicar`):**
   - Payload: `{ name?: string, scheduledDate: Date }` (si no se envía `name`, usar `"Copia de <nombre original>"`).
   - Verifica que la campaña origen exista y pertenezca a `empresaId` (`404` si no).
   - Valida que la plantilla original siga existiendo y los participantes originales sigan perteneciendo a `empresaId`.
   - Crea en una transacción una nueva campaña con `estado = 'programada'`, misma plantilla y modalidad de envío, y nuevos `token_rastreo` UUIDv4 en `campana_usuarios`.

9. **Cancelación (`PATCH /empresas/:empresaId/campanas/:id/cancelar`):**
   - Verifica pertenencia a `empresaId` (`404` si no).
   - Solo permite cancelar si `estado === 'programada' || estado === 'en_curso'`; en otro caso rechaza con `400 Bad Request`.

## Diseño técnico obligatorio

- **Arquitectura Hexagonal estricta (`src/campanas/`):**
  - `domain/`: Entidad `CampaignEntity` e invariantes de negocio puras (validación de estados editables, cancelables y reglas de objetivos) sin imports de Prisma ni NestJS.
  - `application/`: Casos de uso independientes (`CreateCampaignUseCase`, `GetCampaignsUseCase`, `GetCampaignSummaryUseCase`, `GetCampaignByIdUseCase`, `GetCampaignParticipantsUseCase`, `UpdateCampaignUseCase`, `ManageCampaignParticipantsUseCase`, `DuplicateCampaignUseCase`, `CancelCampaignUseCase`) y puertos (`CampaignRepositoryPort`).
  - `infrastructure/`: `CampanasController`, DTOs HTTP con `class-validator` + `class-transformer` (`@Type(() => Date)` para fechas ISO 8601), y `PrismaCampaignRepository`.
- **Regla TypeScript (`tsconfig.json`):** Uso obligatorio de `import type` para interfaces/puertos inyectados en constructores decorados (`isolatedModules` + `emitDecoratorMetadata`).
- **Aislamiento entre módulos:** `CampanasModule` no importa repositorios Prisma de otros módulos; todas las consultas de apoyo de su agregado se resuelven dentro de `PrismaCampaignRepository`.

## Plan de implementación

1. Verificar `prisma/schema.prisma` para confirmar nombres exactos de tablas, campos y relaciones de `campanas`, `campana_usuarios`, `plantillas`, `usuarios` y `departamentos`.
2. Actualizar `domain/` de `campanas` con las reglas de transición de estado (edición, gestión de objetivos y cancelación).
3. Actualizar `CampaignRepositoryPort` e implementar todos los métodos multi-tenant en `PrismaCampaignRepository`.
4. Implementar/actualizar los Casos de Uso en `application/` usando `import type` en constructores.
5. Crear/actualizar DTOs de validación (`CreateCampaignDto`, `UpdateCampaignDto`, `ManageParticipantsDto`, `DuplicateCampaignDto`, `GetCampaignsQueryDto`, `GetParticipantsQueryDto`) y endpoints en `CampanasController` respetando el orden de rutas y pipes (`ParseIntPipe`, `ParseUUIDPipe`).
6. Documentar Swagger en todos los nuevos endpoints y DTOs (`200`, `201`, `400`, `401`, `403`, `404`).
7. Ejecutar `npm run build` verificando 0 errores de TypeScript.
8. Actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md` con todos los contratos de Fase 1.

## Criterios de aceptación

- Todos los endpoints de `/empresas/:empresaId/campanas` están protegidos por `JwtAuthGuard` y `CompanyTenantGuard`.
- Se soporta creación y ampliación de objetivos tanto por `targetUserIds` (`UUIDv4[]`) como por `departmentIds` (`INT[]`) con deduplicación y aislamiento multi-tenant.
- Solo las campañas en estado `'programada'` pueden editarse o modificar sus participantes; solo `'programada'` o `'en_curso'` pueden cancelarse.
- `GET /empresas/:empresaId/campanas/resumen` y `GET /empresas/:empresaId/campanas/:id/participantes` funcionan sin colisiones de rutas y devuelven respuestas paginadas/estructuradas limpias.
- `npm run build` compila con **0 errores**.
- `specs/API_CONTRACTS.md` refleja todos los nuevos endpoints, payloads y respuestas.