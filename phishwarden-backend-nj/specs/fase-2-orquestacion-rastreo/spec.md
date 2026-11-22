# Fase 2 Backend - Orquestación de Envíos (Resend/Twilio), Tracking Público y Zero-Credential Storage

## Objetivo

Implementar el motor de ejecución de campañas y rastreo de simulaciones en `phishwarden-backend-nj/` bajo arquitectura Hexagonal, integrando el despacho automatizado y bajo demanda de correos electrónicos (**Resend**) y SMS (**Twilio**), la personalización dinámica de landing pages según la plantilla (`landing_tipo`), la captura pública de eventos de interacción (`/track/...`) cumpliendo estrictamente **Zero-Credential Storage**, y la actualización automática del puntaje de riesgo (`score_riesgo`) del colaborador.

## Alcance

### Incluido

1. **Evolución de Esquema BD y Módulo `plantillas` (`landing_tipo`):**
   - Incorporar columna `landing_tipo` (`VARCHAR(30) DEFAULT 'generico'`) en la tabla `plantillas` (valores permitidos: `'microsoft' | 'google' | 'corporativo' | 'bancario' | 'generico'`) y sincronizar `prisma/schema.prisma`.
   - Actualizar DTOs y respuestas de `plantillas` (`POST`, `PUT`, `GET`) para soportar `landingTipo` de forma opcional, manteniendo retrocompatibilidad con plantillas existentes mediante inferencia inteligente por palabras clave cuando sea `'generico'`.
2. **Motor de Despacho de Campañas (Resend + Twilio + Scheduler):**
   - Puertos Hexagonales (`EmailSenderPort`, `SmsSenderPort`, `SimulationAlertHookPort`) con adaptadores reales para **Resend** (Phishing) y **Twilio** (Smishing), controlados por variable de entorno `DISPATCH_MODE` (`'sandbox'` | `'live'`).
   - Interpolación dinámica de variables en plantillas (`{{nombre}}`, `{{correo}}`, `{{empresa}}`, `{{enlace_simulacion}}`, `{{pixel_rastreo}}`) usando el `token_rastreo` UUIDv4 único de `campana_usuarios`.
   - Tarea programada (`@nestjs/schedule`) ejecutándose cada minuto para procesar campañas `'programada'` cuya `fecha_programada <= NOW()`, respetando `modalidad_envio` (`'masivo'` vs `'escalonado'`).
   - Endpoint administrativo `POST /empresas/:empresaId/campanas/:id/despachar` protegido por `JwtAuthGuard` + `CompanyTenantGuard` para ejecutar el despacho inmediato de una campaña `'programada'` (ideal para demos y validación controlada).
3. **Endpoints Públicos de Rastreo y Zero-Credential Storage (`/track/...`):**
   - `GET /track/open/:token`: Registra apertura (`correo_abierto`) y devuelve un píxel GIF transparente `1x1` (`image/gif`).
   - `GET /track/click/:token`: Registra clic (`enlace_clicado`), actualiza `score_riesgo` y `racha_dias_seguros`, y redirige (`302`) al frontend público (`${FRONTEND_URL}/sim/verificar?t=:token`).
   - `GET /track/context/:token`: Devuelve contexto seguro y no sensible para renderizar la landing page acorde a la plantilla (`landingTipo`, `metodoAtaque`, `nombreEmpresa`, `tituloPlantilla`, `asunto`, `indicadorDificultad`).
   - `POST /track/submit`: Registra envío de credenciales simuladas (`credenciales_ingresadas`) aceptando **exclusivamente** `{ token }` (`forbidNonWhitelisted: true`), actualiza `score_riesgo`, dispara el hook interno de alerta (preparado para Fase 3 FCM) y devuelve retroalimentación educativa.
4. Actualización de `phishwarden-backend-nj/specs/API_CONTRACTS.md` (incorporando las rutas públicas `/track/*` y el endpoint de despacho).

### Excluido

- Integración real con Firebase Cloud Messaging (FCM) y registro de tokens móviles (`fcm_token`) — corresponde a Fase 3 (se deja preparado el puerto/evento interno `SimulationAlertHookPort`).
- Endpoints móviles de microlecciones, quizzes y gamificación — corresponde a Fases 3 y 4.
- Endpoints de analítica agregada y reportes ejecutivos — corresponde a Fase 5.

## Estado inicial requerido por la auditoría

- Verificar en `prisma/schema.prisma` y `phishwarden.sql` los nombres exactos de columnas y restricciones CHECK de `eventos_simulacion`, `usuarios`, `campanas`, `campana_usuarios` y `plantillas` antes de escribir consultas Prisma.
- El módulo `campanas` ya genera `token_rastreo` (UUIDv4) por cada colaborador en `campana_usuarios` al crear o duplicar una campaña.

## Reglas funcionales

1. **Política Estricta Zero-Credential Storage:**
   - Ningún endpoint del sistema puede recibir, almacenar, registrar en consola (`Logger`) ni procesar contraseñas o datos ingresados en formularios de simulación.
   - `POST /track/submit` debe validar el cuerpo con `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` aceptando únicamente `token` (UUIDv4). Si un cliente intenta enviar `password`, `email` u otro campo adicional, el backend lo rechazará con `400 Bad Request`.

2. **Modos de Despacho (`DISPATCH_MODE`):**
   - **`sandbox` (por defecto si no se configura):** Simula el envío registrando en logs estructurados el destinatario (correo o teléfono), el asunto/cuerpo renderizado y el enlace con `token_rastreo`, marcando la campaña como enviada sin invocar APIs externas.
   - **`live`:**
     - Para `metodo_ataque === 'phishing'`: Envía correo HTML mediante **Resend** (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`), inyectando automáticamente el píxel de apertura si la plantilla no incluye `{{pixel_rastreo}}`.
     - Para `metodo_ataque === 'smishing'`: Envía SMS mediante **Twilio** (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`) solo a colaboradores que tengan `telefono` válido; omite y registra advertencia controlada para colaboradores sin teléfono sin abortar el resto de la campaña.

3. **Modalidades de Envío (`masivo` vs `escalonado`):**
   - **`masivo`:** Despacha todos los mensajes en lotes consecutivos respetando límites de tasa básicos.
   - **`escalonado`:** Divide los destinatarios en micro-lotes distribuidos progresivamente (con retardo configurable entre lotes) para evitar bloqueos por filtros anti-spam.

4. **Resolución Inteligente de `landingTipo`:**
   - Si `plantillas.landing_tipo` es distinto de `'generico'` y no es nulo, se utiliza su valor exacto (`microsoft`, `google`, `corporativo`, `bancario`).
   - Si es `'generico'` o nulo, se infiere automáticamente analizando `titulo` y `asunto` (insensible a mayúsculas):
     - Contiene `outlook`, `microsoft`, `office`, `365`, `teams` → `'microsoft'`.
     - Contiene `google`, `gmail`, `drive`, `workspace` → `'google'`.
     - Contiene `banco`, `bcp`, `interbank`, `bbva`, `scotiabank`, `tarjeta`, `transferencia` → `'bancario'`.
     - Caso contrario → `'corporativo'`.

5. **Registro de Eventos (`eventos_simulacion`) y Cálculo de `score_riesgo`:**
   - Validar que `token` sea UUIDv4 (`ParseUUIDPipe` / `@IsUUID('4')`) y exista en `campana_usuarios` asociado a una campaña cuyo estado no sea `'cancelada'`.
   - Evitar inflar artificialmente el puntaje si el usuario recarga la página múltiples veces para el mismo evento en la misma campaña (aplicar idempotencia en el incremento de `score_riesgo` por tipo de evento dentro de un mismo `campana_usuario`):
     - `correo_abierto`: registra evento en `eventos_simulacion` (sin penalización o +2 puntos configurables, sin reiniciar racha).
     - `enlace_clicado`: registra evento, incrementa `usuarios.score_riesgo` (+15 puntos, tope máximo 100) y reinicia `usuarios.racha_dias_seguros = 0`.
     - `credenciales_ingresadas`: registra evento, incrementa `usuarios.score_riesgo` (+30 puntos adicionales, tope máximo 100), reinicia `usuarios.racha_dias_seguros = 0` y dispara `SimulationAlertHookPort` con los datos del colaborador y tipo de ataque (preparado para Fase 3 FCM).

## Diseño técnico obligatorio

- **Arquitectura Hexagonal estricta:**
  - `src/simulaciones/domain/`: Entidades y reglas puras de cálculo de riesgo, interpolación de plantillas e inferencia de `landingTipo` (sin imports de NestJS, Prisma, Resend o Twilio).
  - `src/simulaciones/application/`: Casos de uso (`DispatchCampaignUseCase`, `ProcessScheduledCampaignsUseCase`, `TrackOpenUseCase`, `TrackClickUseCase`, `GetSimulationContextUseCase`, `TrackSubmitUseCase`) y puertos (`EmailSenderPort`, `SmsSenderPort`, `SimulationTrackingRepositoryPort`, `SimulationAlertHookPort`).
  - `src/simulaciones/infrastructure/`:
    - `TrackingController` (rutas públicas bajo `@Controller('track')`).
    - Adaptadores `ResendEmailAdapter`, `TwilioSmsAdapter`, `LoggingAlertHookAdapter` y `PrismaSimulationTrackingRepository`.
    - Worker `CampaignSchedulerService` con `@Cron(CronExpression.EVERY_MINUTE)`.
  - Integración en `CampanasController`: endpoint `POST /empresas/:empresaId/campanas/:id/despachar` protegido por `JwtAuthGuard` y `CompanyTenantGuard`.
- **Regla TypeScript (`tsconfig.json`):** Uso obligatorio de `import type` para interfaces/puertos inyectados en constructores decorados (`isolatedModules` + `emitDecoratorMetadata`).
- **Variables de entorno (`.env.example`):** Documentar `DISPATCH_MODE`, `BACKEND_PUBLIC_URL`, `FRONTEND_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.

## Plan de implementación

1. Actualizar SQL (`phishwarden.sql` / script de migración) añadiendo `landing_tipo` a `plantillas`, ejecutar migración/sincronización de `prisma/schema.prisma` (`npx prisma generate`) y actualizar DTOs/respuestas de `plantillas`.
2. Instalar dependencias necesarias (`@nestjs/schedule`, `resend`, `twilio`) en `phishwarden-backend-nj/`.
3. Crear `src/simulaciones/domain/` con reglas puras de interpolación de plantillas, inferencia de `landingTipo` y cálculo de `score_riesgo` con tope 100.
4. Crear `src/simulaciones/application/` con puertos y casos de uso de despacho y rastreo público.
5. Implementar infraestructura en `src/simulaciones/infrastructure/` (adaptadores Resend/Twilio con modo `sandbox`/`live`, repositorio Prisma, cron scheduler y `TrackingController`).
6. Añadir endpoint `POST /empresas/:empresaId/campanas/:id/despachar` en `CampanasController`.
7. Documentar Swagger y actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md` y `.env.example`.
8. Ejecutar `npm run build` verificando **0 errores de TypeScript**.

## Criterios de aceptación

- La tabla `plantillas` soporta `landing_tipo` sin afectar plantillas existentes y con inferencia automática inteligente.
- Las campañas `'programada'` se despachan automáticamente al llegar su `fecha_programada` y también pueden despacharse manualmente vía `POST /empresas/:empresaId/campanas/:id/despachar`.
- En modo `sandbox` se simulan envíos de correo y SMS detallados en logs sin consumir cuotas externas; en modo `live` se integran Resend y Twilio.
- Los endpoints públicos `/track/open/:token`, `/track/click/:token`, `/track/context/:token` y `/track/submit` funcionan sin JWT, aplican **Zero-Credential Storage** estricto, registran eventos en `eventos_simulacion` y actualizan `score_riesgo` de forma idempotente.
- `npm run build` compila con **0 errores**.
- `specs/API_CONTRACTS.md` y `.env.example` están actualizados.