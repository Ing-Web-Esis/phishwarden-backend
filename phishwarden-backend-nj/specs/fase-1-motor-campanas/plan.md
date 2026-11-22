# Plan de Implementación: Fase 1 Backend - Motor Completo de Campañas

Este documento detalla la planificación técnica para auditar, expandir y blindar el módulo `campanas` en `phishwarden-backend-nj/`, cumpliendo la arquitectura Hexagonal (Puertos y Adaptadores), las restricciones multi-tenant de `specs/CONSTITUTION.md` y los requerimientos funcionales de `specs/fase-1-motor-campanas/spec.md`.

---

## 1. Mapeo Exacto de Columnas y Relaciones de `prisma/schema.prisma`

La inspección directa de `prisma/schema.prisma` y `phishwarden.sql` confirma la siguiente estructura de tablas, tipos de claves y relaciones para el agregado de campañas:

### 1.1. Tabla `campanas`
* **`id`:** `String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid` (PK, UUIDv4 obligatorio, validado con `ParseUUIDPipe` / `@IsUUID('4')`).
* **`plantilla_id`:** `Int?` (FK hacia `plantillas.id`, validado con `ParseIntPipe` / `@IsInt()`).
* **`nombre`:** `String @db.VarChar(150)` (Obligatorio, nombre identificador de la campaña).
* **`fecha_programada`:** `DateTime @db.Timestamptz(6)` (Obligatorio, fecha de inicio programada, mapeado con `@Type(() => Date)` y `@IsDate()`).
* **`modalidad_envio`:** `String? @default("masivo") @db.VarChar(50)` (Restricción CHECK: `'masivo' | 'escalonado'`).
* **`estado`:** `String? @default("programada") @db.VarChar(20)` (Restricción CHECK: `'programada' | 'en_curso' | 'finalizada' | 'cancelada'`).
* **`creado_el`:** `DateTime? @default(now()) @db.Timestamptz(6)`.
* **Relaciones Prisma:**
  * `plantillas`: relación opcional N:1 hacia `model plantillas` (`onDelete: Restrict`).
  * `campana_usuarios`: relación 1:N hacia `model campana_usuarios` (`onDelete: Cascade`).
  * `eventos_simulacion`: relación 1:N hacia `model eventos_simulacion` (`onDelete: Cascade`).

### 1.2. Tabla `campana_usuarios`
* **`id`:** `String @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid` (PK, UUIDv4).
* **`campana_id`:** `String? @db.Uuid` (FK hacia `campanas.id`, UUIDv4).
* **`usuario_id`:** `String? @db.Uuid` (FK hacia `usuarios.id`, UUIDv4).
* **`token_rastreo`:** `String? @unique @default(dbgenerated("uuid_generate_v4()")) @db.Uuid` (UUIDv4 único para enlaces de rastreo seguro; **estrictamente confidencial, nunca expuesto en respuestas administrativas**).
* **Restricción de unicidad:** `@@unique([campana_id, usuario_id])` (previene duplicar un colaborador en la misma campaña).
* **Relaciones Prisma:**
  * `campanas`: N:1 hacia `model campanas`.
  * `usuarios`: N:1 hacia `model usuarios` (`onDelete: Cascade`).

### 1.3. Aislamiento Multi-tenant del Agregado
* La tabla `campanas` no cuenta con una columna `empresa_id` directa en la base de datos física (`phishwarden.sql`).
* **Mecanismo de pertenencia y blindaje al tenant:**
  1. Cada campaña creada vincula obligatoriamente participantes de la empresa (`targetUserIds` o colaboradores activos de `departmentIds`).
  2. Todas las consultas de lectura (`findPaginated`, `findById`, `findSummary`, `findParticipantsPaginated`) y mutación (`update`, `addParticipants`, `removeParticipant`, `cancel`, `duplicate`) aplican filtros que exigen que los participantes pertenezcan estrictamente a la empresa del tenant autenticado:
     ```typescript
     campana_usuarios: {
       some: {
         usuarios: {
           empresa_id: companyId,
         },
       },
     }
     ```
  3. Toda plantilla asignada (`plantilla_id`) se valida previamente para garantizar que pertenezca a la empresa (`empresa_id === companyId`) o sea una plantilla global del sistema (`empresa_id === null`).
  4. La regla de negocio de borrado de participantes exige que **siempre quede al menos un participante** en la campaña, garantizando la integridad referencial del tenant.

---

## 2. Arquitectura Hexagonal y Diseño de Componentes

Siguiendo la regla estricta de dependencias `Infrastructure -> Application -> Domain` y el uso obligatorio de `import type` en constructores decorados:

### 2.1. Capa de Dominio (`src/campanas/domain/`)

* **`campaign.entity.ts`:**
  * Enums de negocio:
    * `CampaignStatus`: `'programada' | 'en_curso' | 'finalizada' | 'cancelada'`
    * `ShippingMethod`: `'masivo' | 'escalonado'`
  * Entidad `CampaignEntity`: Contiene atributos puros (`id`, `templateId`, `name`, `scheduledDate`, `shippingMethod`, `status`, `createdAt`, `targetUserIds`, `template`, `totalParticipants`).
  * Invariantes y métodos de dominio:
    * `isEditable(): boolean`: Retorna `true` únicamente si `status === CampaignStatus.PROGRAMADA`.
    * `isCancelable(): boolean`: Retorna `true` únicamente si `status === CampaignStatus.PROGRAMADA || status === CampaignStatus.EN_CURSO`.
    * `canModifyParticipants(): boolean`: Retorna `true` únicamente si `status === CampaignStatus.PROGRAMADA`.

### 2.2. Capa de Aplicación (`src/campanas/application/`)

* **Puerto `CampaignRepositoryPort` (`src/campanas/application/campaign.repository.port.ts`):**
  ```typescript
  export interface CampaignRepositoryPort {
    findSummary(companyId: number): Promise<CampaignSummaryResult>;
    findPaginated(companyId: number, params: FindCampaignsParams): Promise<PaginatedCampaignsResult>;
    findById(id: string, companyId?: number): Promise<CampaignDetailResult | null>;
    findParticipantsPaginated(campaignId: string, companyId: number, params: FindParticipantsParams): Promise<PaginatedParticipantsResult>;
    create(companyId: number, data: CreateCampaignInput): Promise<CampaignEntity>;
    update(id: string, companyId: number, data: UpdateCampaignInput): Promise<CampaignEntity>;
    addParticipants(campaignId: string, companyId: number, userIds: string[]): Promise<number>;
    removeParticipant(campaignId: string, companyId: number, userId: string): Promise<boolean>;
    countParticipants(campaignId: string, companyId: number): Promise<number>;
    duplicate(id: string, companyId: number, newName?: string, scheduledDate?: Date): Promise<CampaignEntity>;
    cancel(id: string, companyId: number): Promise<boolean>;
    validateTemplateBelongsToCompanyOrGlobal(templateId: number, companyId: number): Promise<boolean>;
    validateUsersBelongToCompany(userIds: string[], companyId: number): Promise<boolean>;
    findUserIdsByDepartmentIds(departmentIds: number[], companyId: number): Promise<string[]>;
  }

  export const CAMPAIGN_REPOSITORY = 'CAMPAIGN_REPOSITORY';
  ```

* **DTOs e Interfaces Internas de Aplicación:**
  * `campaign-summary.result.ts`: `{ total: number; programadas: number; enCurso: number; finalizadas: number; canceladas: number }`.
  * `campaign-detail.result.ts`: Datos de campaña + desglose de plantilla (`id`, `titulo`, `metodoAtaque`, `asunto`, `cuerpoHtml`, `indicadorDificultad`) + `totalParticipantes`.
  * `campaign-participant.result.ts`: `{ usuarioId: string; nombre: string; correo: string; departamento: string | null; estado: string }`.

* **Casos de Uso (en `src/campanas/application/`):**
  * Todos los casos de uso implementarán constructores con `import type { CampaignRepositoryPort }` y `@Inject(CAMPAIGN_REPOSITORY)`:
    1. **`GetCampaignSummaryUseCase`:** Invoca `findSummary(companyId)`.
    2. **`GetCampaignsUseCase`:** Valida paginación (`page >= 1`, `limit >= 1`) e invoca `findPaginated`.
    3. **`GetCampaignByIdUseCase`:** Invoca `findById(id, companyId)`; lanza `NotFoundException` si no existe.
    4. **`GetCampaignParticipantsUseCase`:** Verifica pertenencia de la campaña al tenant (lanza `NotFoundException` si no) y obtiene participantes paginados.
    5. **`CreateCampaignUseCase`:**
       * Valida que se reciba `targetUserIds` o `departmentIds`.
       * Resuelve usuarios activos por departamento si se envían `departmentIds`.
       * Deduplica la lista de `usuario_id`. Si queda vacía, lanza `BadRequestException`.
       * Valida pertenencia de todos los usuarios a la empresa (`validateUsersBelongToCompany`).
       * Valida plantilla (`validateTemplateBelongsToCompanyOrGlobal`).
       * Invoca `create` dentro de una transacción atómica.
    6. **`UpdateCampaignUseCase`:**
       * Obtiene la campaña (`findById`); valida que pertenezca al tenant (`NotFoundException` si no).
       * Valida invariante de dominio `isEditable()` (lanza `BadRequestException` si no está `'programada'`).
       * Si se cambia `templateId`, valida pertenencia de la nueva plantilla.
       * Invoca `update`.
    7. **`ManageCampaignParticipantsUseCase`:**
       * `addParticipants`: Valida estado `'programada'`, resuelve y filtra usuarios ya inscritos, e inserta nuevos con token UUIDv4.
       * `removeParticipant`: Valida estado `'programada'`, verifica que el participante esté en la campaña, valida que queden al menos 2 participantes antes de borrar (rechaza con `BadRequestException` si se intenta borrar al último), y elimina el registro.
    8. **`DuplicateCampaignUseCase`:**
       * Valida existencia y pertenencia de la campaña origen.
       * Genera el nuevo nombre (`newName` o `"Copia de <nombre>"`).
       * Crea nueva campaña `'programada'` clonando la configuración y generando nuevos `token_rastreo` UUIDv4 para cada participante.
    9. **`CancelCampaignUseCase`:**
       * Obtiene la campaña; valida pertenencia al tenant (`NotFoundException` si no).
       * Valida invariante de dominio `isCancelable()` (solo `'programada'` o `'en_curso'`; lanza `BadRequestException` en `'finalizada'` o `'cancelada'`).
       * Invoca `cancel`.

### 2.3. Capa de Infraestructura (`src/campanas/infrastructure/`)

* **DTOs de Validación HTTP (con `class-validator` y `@nestjs/swagger`):**
  1. `CreateCampaignDto`:
     * `name`: `@IsString()`, `@IsNotEmpty()`
     * `templateId`: `@IsInt()`
     * `scheduledDate`: `@Type(() => Date)`, `@IsDate()`
     * `shippingMethod`: `@IsEnum(ShippingMethod)`
     * `targetUserIds`: `@IsOptional()`, `@IsArray()`, `@IsUUID('4', { each: true })`
     * `departmentIds`: `@IsOptional()`, `@IsArray()`, `@IsInt({ each: true })`
  2. `UpdateCampaignDto`:
     * `name`: `@IsOptional()`, `@IsString()`, `@IsNotEmpty()`
     * `templateId`: `@IsOptional()`, `@IsInt()`
     * `scheduledDate`: `@IsOptional()`, `@Type(() => Date)`, `@IsDate()`
     * `shippingMethod`: `@IsOptional()`, `@IsEnum(ShippingMethod)`
  3. `ManageParticipantsDto`:
     * `targetUserIds`: `@IsOptional()`, `@IsArray()`, `@IsUUID('4', { each: true })`
     * `departmentIds`: `@IsOptional()`, `@IsArray()`, `@IsInt({ each: true })`
  4. `DuplicateCampaignDto`:
     * `name`: `@IsOptional()`, `@IsString()`
     * `scheduledDate`: `@Type(() => Date)`, `@IsDate()`
  5. `GetCampaignsQueryDto`:
     * `page`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)` (default 1)
     * `limit`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)` (default 10)
     * `search`: `@IsOptional()`, `@IsString()`
     * `status`: `@IsOptional()`, `@IsEnum(CampaignStatus)`
     * `attackType`: `@IsOptional()`, `@IsString()`
  6. `GetParticipantsQueryDto`:
     * `page`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)` (default 1)
     * `limit`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)` (default 10)
     * `search`: `@IsOptional()`, `@IsString()`
     * `departmentId`: `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`

* **`PrismaCampaignRepository` (`prisma-campaign.repository.ts`):**
  * Implementación completa de `CampaignRepositoryPort` utilizando `this.prisma.$transaction` para operaciones multi-tabla (campaña + participantes).
  * Generación de `token_rastreo` UUIDv4 mediante `crypto.randomUUID()` en NodeJS o defaults de base de datos.
  * Mapeo limpio que excluye datos confidenciales y calcula métricas solicitadas (`totalParticipantes`).

---

## 3. Orden Exacto de Rutas en `CampanasController`

Para prevenir colisiones de enrutamiento en NestJS (donde un segmento fijo como `resumen` sea capturado por un parámetro comodín `:id` y falle con 400 en `ParseUUIDPipe`), las rutas se declaran en el siguiente orden estricto:

```typescript
@ApiTags('campanas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@Controller('empresas/:empresaId/campanas')
export class CampanasController {

  // 1. Rutas Estáticas GET
  @Get('resumen')
  async getSummary(@Param('empresaId', ParseIntPipe) empresaId: number) {}

  @Get()
  async getCampaigns(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: GetCampaignsQueryDto,
  ) {}

  // 2. Rutas Paramétricas Compuestas (sub-recursos antes del :id simple)
  @Get(':id/participantes')
  async getParticipants(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetParticipantsQueryDto,
  ) {}

  // 3. Ruta Paramétrica Simple GET
  @Get(':id')
  async getCampaignById(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {}

  // 4. Creación POST
  @Post()
  async createCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateCampaignDto,
  ) {}

  // 5. Mutaciones Específicas / Sub-recursos POST y DELETE
  @Post(':id/participantes')
  async addParticipants(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageParticipantsDto,
  ) {}

  @Delete(':id/participantes/:usuarioId')
  async removeParticipant(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {}

  @Post(':id/duplicar')
  async duplicateCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateCampaignDto,
  ) {}

  // 6. Mutaciones PATCH
  @Patch(':id/cancelar')
  async cancelCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {}

  @Patch(':id')
  async updateCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {}
}
```

---

## 4. Gestión de Transiciones de Estado y Manejo de Errores

| Acción | Estados Permitidos | Estados Prohibidos | Código / Excepción |
|---|---|---|---|
| Consultar detalle / participantes | Cualquiera (perteneciente al tenant) | Campaña ajena o inexistente | `404 Not Found` |
| Editar campaña (`PATCH /:id`) | `programada` | `en_curso`, `finalizada`, `cancelada` | `400 Bad Request` ("Solo se pueden editar campañas programadas") |
| Agregar participantes (`POST /:id/participantes`) | `programada` | `en_curso`, `finalizada`, `cancelada` | `400 Bad Request` ("Solo se pueden modificar participantes en campañas programadas") |
| Remover participante (`DELETE /:id/participantes/:userId`) | `programada` (quedando >= 1 participante) | `en_curso`, `finalizada`, `cancelada` o último participante | `400 Bad Request` ("No se puede remover el último participante") |
| Duplicar campaña (`POST /:id/duplicar`) | Cualquiera (existente en tenant) | Campaña ajena o inexistente | `404 Not Found` |
| Cancelar campaña (`PATCH /:id/cancelar`) | `programada`, `en_curso` | `finalizada`, `cancelada` | `400 Bad Request` ("La campaña ya se encuentra finalizada o cancelada") |

---

## 5. Estrategia de Verificación y Compilación

1. **Pureza TypeScript:** Verificar que `src/campanas/domain/` y `src/campanas/application/` no contengan importaciones de `@prisma/client`, `@nestjs/swagger` ni decoradores HTTP.
2. **`import type`:** Comprobar que en todos los constructores de casos de uso y repositorios se use `import type` para interfaces inyectadas.
3. **Compilación:** Ejecutar `npm run build` en `phishwarden-backend-nj/` verificando 0 errores de TypeScript.
4. **Contratos API:** Actualizar exhaustivamente `phishwarden-backend-nj/specs/API_CONTRACTS.md` con todos los endpoints de Fase 1.
