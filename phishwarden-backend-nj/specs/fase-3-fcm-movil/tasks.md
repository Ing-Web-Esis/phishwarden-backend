# Tareas de Implementación — Fase 3: M3 Backend para App Móvil (Vinculación, Push FCM y Reporte)

## Fase 3.1: Ajuste de `score_riesgo` Inicial a `0` y Esquema de Base de Datos
- [x] **T3.1:** Actualizar `prisma/schema.prisma` estableciendo `score_riesgo Int? @default(0)` en el modelo `usuarios` y añadiendo el modelo `reportes_sospechosos`.
- [x] **T3.2:** Ejecutar `npx prisma generate` en `phishwarden-backend-nj/`.
- [x] **T3.3:** Ejecutar la migración SQL en PostgreSQL para alterar el valor por defecto de `score_riesgo` a `0`, resetear usuarios existentes sin eventos de fallo y crear la tabla `reportes_sospechosos`.
- [x] **T3.4:** Actualizar `phishwarden-backend/phishwarden.sql` reflejando el valor por defecto `DEFAULT 0` en `usuarios.score_riesgo` y agregando la tabla `reportes_sospechosos`.
- [x] **T3.5:** Actualizar `src/empleados/infrastructure/prisma-employee.repository.ts` (`createEmployee`, `bulkCreateEmployees`, `findSummaryByCompany`) y `src/simulaciones/domain/risk-score-calculator.service.ts` inicializando y calculando con base en `score_riesgo = 0`.

## Fase 3.2: Dependencias y Puertos de Dominio/Aplicación Móvil
- [x] **T3.6:** Añadir la dependencia `firebase-admin` en `package.json` de `phishwarden-backend-nj/`.
- [x] **T3.7:** Crear entidades y enums de dominio en `src/mobile/domain/`:
  - `mobile-user.entity.ts`
  - `mobile-report.entity.ts`
  - `mobile-report-channel.enum.ts` (`'email' | 'sms' | 'otro'`)
- [x] **T3.8:** Crear el puerto de repositorio en `src/mobile/application/mobile.repository.port.ts` con el token `MOBILE_REPOSITORY_PORT`.
- [x] **T3.9:** Crear el puerto de notificaciones push en `src/mobile/application/push-notification.port.ts` con el token `PUSH_NOTIFICATION_PORT`.

## Fase 3.3: Casos de Uso del Módulo Móvil
- [x] **T3.10:** Implementar `src/mobile/application/vincular-mobile.use-case.ts` (`VincularMobileUseCase`) validando `correo_corporativo` + `codigo_acceso` y emitiendo JWT con `role: 'EMPLOYEE'`.
- [x] **T3.11:** Implementar `src/mobile/application/get-mobile-profile.use-case.ts` (`GetMobileProfileUseCase`) retornando datos del colaborador autenticado.
- [x] **T3.12:** Implementar `src/mobile/application/update-push-token.use-case.ts` (`UpdatePushTokenUseCase`) guardando `token_notificacion_push`.
- [x] **T3.13:** Implementar `src/mobile/application/remove-push-token.use-case.ts` (`RemovePushTokenUseCase`) limpiando `token_notificacion_push`.
- [x] **T3.14:** Implementar `src/mobile/application/report-suspicious-message.use-case.ts` (`ReportSuspiciousMessageUseCase`) insertando el reporte, reduciendo `score_riesgo` (piso en `0`) e incrementando `racha_dias_seguros + 1`.

## Fase 3.4: Infraestructura, Guards, Adaptador FCM y Controlador Móvil
- [x] **T3.15:** Implementar `src/mobile/infrastructure/employee-jwt.guard.ts` (`EmployeeJwtGuard`) verificando Bearer JWT y exigiendo `role === 'EMPLOYEE'`.
- [x] **T3.16:** Implementar `src/mobile/infrastructure/fcm-push.service.ts` (`FcmPushService`) implementando `PushNotificationPort` con soporte para `FCM_MODE=sandbox|live` y auto-limpieza de tokens inválidos.
- [x] **T3.17:** Implementar `src/mobile/infrastructure/prisma-mobile.repository.ts` (`PrismaMobileRepository`) implementando `MobileRepositoryPort`.
- [x] **T3.18:** Crear los DTOs de entrada en `src/mobile/infrastructure/`:
  - `vincular-mobile.dto.ts`
  - `update-push-token.dto.ts`
  - `create-mobile-report.dto.ts`
- [x] **T3.19:** Implementar `src/mobile/infrastructure/mobile.controller.ts` exponiendo los endpoints `/mobile/*` con anotaciones completas de Swagger.
- [x] **T3.20:** Crear `src/mobile/mobile.module.ts` configurando proveedores, exportaciones y registrarlo en `src/app.module.ts`.

## Fase 3.5: Exposición de `codigoAcceso` para el Administrador
- [x] **T3.21:** Actualizar `src/auth/infrastructure/prisma-auth.repository.ts` (`findAdminProfileById`) para incluir `codigoAcceso: admin.empresas.codigo_acceso` en la respuesta de `GET /auth/me`.
- [x] **T3.22:** Implementar `GET /empresas/:empresaId` en `src/empresas/infrastructure/empresas.controller.ts` (protegido por `JwtAuthGuard` + `CompanyTenantGuard`) para consultar los datos de la empresa incluyendo `codigoAcceso`.

## Fase 3.6: Alertas Push No Bloqueantes en Rastreo (Fase 2)
- [x] **T3.23:** Actualizar `src/simulaciones/application/simulation-tracking.repository.port.ts` y `prisma-simulation-tracking.repository.ts` para mapear `usuarioPushToken` (`usuarios.token_notificacion_push`) en `TrackingParticipantDetail`.
- [x] **T3.24:** Actualizar `src/simulaciones/application/track-click.use-case.ts` para enviar push no bloqueante (`SIMULATION_CLICK`) cuando el colaborador posea `usuarioPushToken`.
- [x] **T3.25:** Actualizar `src/simulaciones/application/track-submit.use-case.ts` para enviar push no bloqueante (`SIMULATION_SUBMIT`) cuando el colaborador posea `usuarioPushToken`.

## Fase 3.7: Documentación, Variables de Entorno y Verificación Final
- [x] **T3.26:** Actualizar `.env.example` y `.env` en `phishwarden-backend-nj/` documentando `FCM_MODE`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY`.
- [x] **T3.27:** Actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md` incorporando la sección `Móvil (Fase 3 - M3)` con todos los contratos de `/mobile/*`, `codigoAcceso` en `GET /auth/me` y `GET /empresas/:empresaId`.
- [x] **T3.28:** Ejecutar `npm run build` en `phishwarden-backend-nj/` confirmando **0 errores de TypeScript**.
