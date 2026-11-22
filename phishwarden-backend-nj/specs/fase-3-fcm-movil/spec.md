# Fase 3: M3 — Backend para App Móvil: Vinculación, Push Notifications y Reporte

## Objetivo

Implementar en `phishwarden-backend-nj/` el módulo móvil (**M3**) para la vinculación de colaboradores mediante `empresas.codigo_acceso` y `correo_corporativo`, la corrección del `score_riesgo` inicial a `0`, la gestión de su perfil y `token_notificacion_push` (FCM), el reporte de intentos reales de phishing/smishing con reducción de `score_riesgo` e incremento de `racha_dias_seguros`, y el envío automático de alertas push FCM cuando un usuario cae en una simulación de la Fase 2.

## Alcance

### Incluido

1. **Ajuste de `score_riesgo` inicial a `0` (`prisma/schema.prisma`, SQL y `src/usuarios/`):**
   - Cambiar `score_riesgo Int? @default(0)` en `prisma/schema.prisma` y ejecutar `npx prisma generate`.
   - Crear migración SQL con `ALTER TABLE usuarios ALTER COLUMN score_riesgo SET DEFAULT 0;` y restablecer a `0` los usuarios existentes que tengan `score_riesgo = 100` y no registren eventos de fallo (`click` o `formulario_enviado`) en `eventos_simulacion`.
   - Asegurar que la creación individual y la importación masiva CSV de colaboradores inicialicen explícitamente `score_riesgo: 0`.

2. **Vinculación Móvil y Aislamiento de Roles (`src/auth/` y `src/empresas/`):**
   - **`POST /mobile/auth/vincular` (público):**
     - Recibe `{ correoCorporativo, codigoAcceso }`.
     - Busca al colaborador activo en `usuarios` por `correo_corporativo` y valida que su empresa tenga exactamente `empresas.codigo_acceso === codigoAcceso`.
     - Emite un JWT de empleado con payload `{ sub: usuario.id, usuarioId: usuario.id, empresaId: usuario.empresa_id, correo: usuario.correo_corporativo, role: 'EMPLOYEE' }` y devuelve los datos básicos del colaborador y su empresa.
   - **Separación de Guards:**
     - Asegurar que `CompanyTenantGuard` (rutas administrativas `/empresas/:empresaId/*`) rechace con `403 Forbidden` los tokens con `role === 'EMPLOYEE'`.
     - Proteger las rutas `/mobile/*` con `JwtAuthGuard` + validación estricta de `role === 'EMPLOYEE'`.
   - **Visibilidad de `codigoAcceso` para el Administrador:**
     - Verificar que el endpoint de detalle de empresa o perfil del administrador (`GET /empresas/:empresaId` y/o `GET /auth/me`) incluya `codigoAcceso` (`empresas.codigo_acceso`) para que el administrador pueda consultarlo y compartirlo con sus colaboradores.

3. **Perfil Móvil y Token FCM (`src/mobile/`):**
   - **`GET /mobile/perfil`:** Devuelve los datos del colaborador autenticado (`id`, `nombre`, `correoCorporativo`, `numeroTelefonico`, `scoreRiesgo`, `rachaDiasSeguros`, `pushHabilitado`, `departamento`, `empresa`).
   - **`PUT /mobile/push-token`:** Registra o actualiza `usuarios.token_notificacion_push` para el colaborador autenticado.
   - **`DELETE /mobile/push-token`:** Limpia `usuarios.token_notificacion_push = null` al desvincular o cerrar sesión en la app móvil.

4. **Reporte de Phishing desde App Móvil (`POST /mobile/reportes`):**
   - Permite al colaborador reportar un mensaje sospechoso (`canal`: `'email' | 'sms' | 'otro'`, `remitente`, `asunto`, `descripcion` / `urlSospechosa`).
   - **Reduce** `usuarios.score_riesgo` (ej. `-5` puntos, acotado con piso mínimo en `0`) e **incrementa** `usuarios.racha_dias_seguros` en `+1`, manteniendo coherencia con la Fase 2 (donde mayor `score_riesgo` significa mayor vulnerabilidad).
   - Registra el evento/reporte y devuelve `scoreRiesgo` y `rachaDiasSeguros` actualizados.

5. **Servicio FCM y Alertas Automáticas tras Simulación (`FcmPushService` + Integración Fase 2):**
   - Implementar `FcmPushService` utilizando `firebase-admin` con variables de entorno (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FCM_MODE=sandbox|live`).
   - En modo `sandbox` (o si faltan credenciales), loguear el payload en consola sin lanzar errores. En modo `live`, enviar la notificación push real y limpiar `usuarios.token_notificacion_push` si Firebase devuelve token inválido/no registrado.
   - Integrar de forma **no bloqueante** en `TrackClickUseCase` y `TrackSubmitUseCase` (Fase 2): cuando el usuario cae en una simulación y posee `token_notificacion_push`, enviar automáticamente una notificación push alertándole del incidente e incluyendo `data` estructurada para la app Flutter.

6. **Documentación y Configuración:**
   - Actualizar `.env.example` con `FCM_MODE`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.
   - Actualizar `specs/API_CONTRACTS.md` con todos los endpoints `/mobile/*`, payloads FCM y códigos de respuesta.

### Excluido

- **Fase 4 (M4):** Todo lo referente a `microlecciones`, `preguntas_evaluacion`, `logros_usuarios`, `insignias_medallas` y `medallas_usuarios`.
- **Fase 5 (M5) y Fase 6:** Endpoints de analítica ejecutiva (`/analytics/*`) y `@nestjs/throttler`.
- Cambios en el frontend web (`phishwarden-web-tl/`) y código fuente de la app Flutter.

## Reglas arquitectónicas y de seguridad

1. **Identidad estricta desde JWT:** Ningún endpoint `/mobile/*` acepta `usuarioId` o `empresaId` en params, query o body; siempre se extraen del JWT verificado (`role === 'EMPLOYEE'`).
2. **Escala coherente de `score_riesgo` (`0` a `100`):** `0` es seguro (valor inicial), caer en simulación (Fase 2) **aumenta** el score (tope `100`), y reportar phishing real (Fase 3) **reduce** el score (piso `0`).
3. **Resiliencia del Tracking:** Un fallo en Firebase/FCM nunca debe interrumpir ni devolver error en `GET /track/click` ni `POST /track/submit`.
4. **Arquitectura Limpia:** Mantener la estructura por capas (`domain`, `application`, `infrastructure`, `presentation`) y DTOs estrictos con `class-validator`.

## Criterios de aceptación

- `prisma/schema.prisma`, migración SQL y creación de usuarios (manual/CSV) establecen `score_riesgo = 0` por defecto.
- `POST /mobile/auth/vincular` valida `correo_corporativo` + `empresas.codigo_acceso` y emite JWT con `role: 'EMPLOYEE'`.
- `CompanyTenantGuard` bloquea (`403`) el acceso de tokens `EMPLOYEE` a endpoints administrativos.
- `GET /mobile/perfil`, `PUT /mobile/push-token`, `DELETE /mobile/push-token` y `POST /mobile/reportes` funcionan end-to-end reduciendo `score_riesgo` (piso `0`) e incrementando `racha_dias_seguros`.
- Al disparar `GET /track/click/:token` o `POST /track/submit/:token` para un usuario con `token_notificacion_push`, se ejecuta `FcmPushService` (sandbox o live) sin afectar la respuesta del tracking.
- `specs/API_CONTRACTS.md` y `.env.example` actualizados, y `npm run build` en `phishwarden-backend-nj/` finaliza con **0 errores**.