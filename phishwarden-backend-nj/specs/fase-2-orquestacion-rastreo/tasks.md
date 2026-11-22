# Tareas Atómicas: Fase 2 Backend - Orquestación de Envíos, Tracking Público y Zero-Credential Storage

## Grupo 1: Evolución de Esquema BD, Dependencias y Configuración

- [x] **T2.1** Actualizar `phishwarden-backend/phishwarden.sql` agregando la columna `landing_tipo VARCHAR(30) DEFAULT 'generico' CHECK (landing_tipo IN ('microsoft', 'google', 'corporativo', 'bancario', 'generico'))` en la tabla `plantillas`.
- [x] **T2.2** Actualizar `phishwarden-backend-nj/prisma/schema.prisma` incorporando `landing_tipo String? @default("generico") @db.VarChar(30)` en el modelo `plantillas`.
- [x] **T2.3** Ejecutar `npx prisma generate` en `phishwarden-backend-nj/` para regenerar el cliente Prisma v5 con la nueva columna.
- [x] **T2.4** Instalar paquetes requeridos en `phishwarden-backend-nj/`: `@nestjs/schedule`, `resend` y `twilio`.
- [x] **T2.5** Crear archivo `phishwarden-backend-nj/.env.example` documentando todas las variables del sistema (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `DISPATCH_MODE`, `BACKEND_PUBLIC_URL`, `FRONTEND_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).

---

## Grupo 2: Módulo `plantillas` (Soporte de `landingTipo` e Inferencia Inteligente)

- [x] **T2.6** Actualizar `src/plantillas/domain/template.entity.ts`:
  - Declarar enum `LandingType` (`'microsoft' | 'google' | 'corporativo' | 'bancario' | 'generico'`).
  - Añadir propiedad `public readonly landingTipo?: LandingType` al constructor de `TemplateEntity`.
- [x] **T2.7** Actualizar DTOs en `src/plantillas/infrastructure/`:
  - En `create-template.dto.ts`, añadir `@IsOptional() @IsEnum(LandingType) landingTipo?: LandingType`.
  - En `update-template.dto.ts`, añadir `@IsOptional() @IsEnum(LandingType) landingTipo?: LandingType`.
- [x] **T2.8** Actualizar `src/plantillas/infrastructure/prisma-template.repository.ts`:
  - Mapear `landing_tipo` en `mapToEntity` (con fallback a `'generico'`).
  - Mapear `landing_tipo` en métodos `create` y `update`.

---

## Grupo 3: Dominio de Simulaciones (`src/simulaciones/domain/`)

- [x] **T2.9** Crear `src/simulaciones/domain/simulation-event-type.enum.ts` con los valores exactos de la BD: `'enviado' | 'abierto' | 'click' | 'formulario_enviado' | 'descarga_adjunto'`.
- [x] **T2.10** Crear `src/simulaciones/domain/landing-inference.service.ts`:
  - Servicio de dominio puro para inferir `landingTipo` a partir de palabras clave en `titulo` y `asunto` cuando sea `'generico'` o nulo.
- [x] **T2.11** Crear `src/simulaciones/domain/template-interpolator.service.ts`:
  - Servicio de dominio puro para sustituir `{{nombre}}`, `{{correo}}`, `{{empresa}}`, `{{enlace_simulacion}}` y `{{pixel_rastreo}}`.
  - Inyección automática del tag `<img src="...">` de apertura al final del cuerpo HTML si no estuviese presente.
- [x] **T2.12** Crear `src/simulaciones/domain/risk-score-calculator.service.ts`:
  - Servicio de dominio puro para calcular el nuevo `score_riesgo` acotado estrictamente entre `0` y `100` (`+15` en click, `+30` en submit) y el reinicio de `racha_dias_seguros = 0`.

---

## Grupo 4: Puertos y Casos de Uso de Aplicación (`src/simulaciones/application/`)

- [x] **T2.13** Definir puertos e interfaces en `src/simulaciones/application/`:
  - `email-sender.port.ts` con token `EMAIL_SENDER_PORT`.
  - `sms-sender.port.ts` con token `SMS_SENDER_PORT`.
  - `simulation-alert-hook.port.ts` con token `SIMULATION_ALERT_HOOK_PORT`.
  - `simulation-tracking.repository.port.ts` con token `SIMULATION_TRACKING_REPOSITORY_PORT`.
- [x] **T2.14** Implementar `DispatchCampaignUseCase`:
  - Orquestar el despacho de campañas `'programada'`, pasando a `'en_curso'`, interpolando mensajes y despachando vía email/SMS según `DISPATCH_MODE` (`sandbox` vs `live`) y modalidad (`masivo` vs `escalonado`).
- [x] **T2.15** Implementar `ProcessScheduledCampaignsUseCase`:
  - Consultar campañas programadas cuya `fecha_programada <= NOW()` e invocar `DispatchCampaignUseCase`.
- [x] **T2.16** Implementar `TrackOpenUseCase`:
  - Manejar `/track/open/:token` con idempotencia, registro de `'abierto'` y retorno del buffer GIF 1x1 transparente (43 bytes).
- [x] **T2.17** Implementar `TrackClickUseCase`:
  - Manejar `/track/click/:token` con idempotencia, registro de `'click'`, incremento de riesgo (+15), reseteo de racha a 0 y retorno de URL de redirección.
- [x] **T2.18** Implementar `GetSimulationContextUseCase`:
  - Manejar `/track/context/:token` retornando metadatos seguros no sensibles e inferencia de `landingTipo`.
- [x] **T2.19** Implementar `TrackSubmitUseCase`:
  - Manejar `POST /track/submit` cumpliendo **Zero-Credential Storage**, idempotencia de `'formulario_enviado'`, incremento de riesgo (+30), reseteo de racha a 0, disparo del hook de alerta y retorno de feedback educativo.

---

## Grupo 5: Infraestructura de Simulaciones (`src/simulaciones/infrastructure/`)

- [x] **T2.20** Crear `src/simulaciones/infrastructure/prisma-simulation-tracking.repository.ts`:
  - Implementar `SimulationTrackingRepositoryPort` con Prisma para transacciones atómicas de eventos, consulta por token y actualización de riesgo.
- [x] **T2.21** Crear adaptadores de envío:
  - `resend-email.adapter.ts` (`ResendEmailAdapter`) con soporte `sandbox` (Logger) y `live` (SDK Resend).
  - `twilio-sms.adapter.ts` (`TwilioSmsAdapter`) con soporte `sandbox` (Logger) y `live` (SDK Twilio).
  - `logging-alert-hook.adapter.ts` (`LoggingAlertHookAdapter`) registrando alertas estructuradas.
- [x] **T2.22** Crear `src/simulaciones/infrastructure/campaign-scheduler.service.ts`:
  - Servicio con `@Cron(CronExpression.EVERY_MINUTE)` invocando `ProcessScheduledCampaignsUseCase`.
- [x] **T2.23** Crear `src/simulaciones/infrastructure/track-submit.dto.ts`:
  - DTO para `POST /track/submit` con validación `@IsUUID('4') token: string`, asegurando rechazo 400 ante campos ajenos.
- [x] **T2.24** Crear `src/simulaciones/infrastructure/tracking.controller.ts`:
  - Controlador público `@Controller('track')` con Swagger para los 4 endpoints (`open`, `click`, `context`, `submit`).
- [x] **T2.25** Crear `src/simulaciones/simulaciones.module.ts`:
  - Conectar puertos con adaptadores, exportar casos de uso e integrar `ScheduleModule`.
- [x] **T2.26** Integrar endpoint de despacho en `src/campanas/infrastructure/campanas.controller.ts`:
  - Añadir `POST /empresas/:empresaId/campanas/:id/despachar` protegido con `JwtAuthGuard` y `CompanyTenantGuard`.
- [x] **T2.27** Actualizar `src/app.module.ts` importando `ScheduleModule.forRoot()` y `SimulacionesModule`.

---

## Grupo 6: Verificación, Contratos y Compilación

- [x] **T2.28** Actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md` documentando los endpoints `/track/*` y `POST /campanas/:id/despachar`.
- [x] **T2.29** Ejecutar `npm run build` en `phishwarden-backend-nj/` y confirmar **0 errores de TypeScript**.
