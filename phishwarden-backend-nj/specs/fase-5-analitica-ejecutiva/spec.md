# Fase 5: M5 — Módulo de Analítica Ejecutiva, Riesgo Organizacional y Reportes

## Objetivo

Implementar en `phishwarden-backend-nj/` el módulo de analítica ejecutiva (**M5**) para que los administradores de cada organización (`empresaId`) visualicen indicadores clave de vulnerabilidad humana, rendimiento de campañas de simulación, tasas de reporte temprano, progreso de capacitación por departamento y exportación segura de reportes ejecutivos.

## Alcance

### Incluido

1. **Seguridad Multi-Tenant y Filtros Temporales:**
   - Todos los endpoints bajo `/empresas/:empresaId/analytics/*` estarán protegidos por `JwtAuthGuard` y `CompanyTenantGuard`, garantizando que ningún administrador pueda consultar métricas de otra empresa.
   - Soporte opcional de filtros por rango de fechas (`?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`) validados mediante DTO con `class-validator`.

2. **Endpoints de Analítica Ejecutiva (`src/analytics/`):**
   - **`GET /empresas/:empresaId/analytics/resumen`:**
     - **Postura de Riesgo:** `scoreRiesgoPromedio` de colaboradores activos (`0` a `100`), más distribución por tramos de riesgo: `bajo` (`0–30`), `medio` (`31–69`) y `critico` (`70–100`).
     - **Adopción Móvil:** Total de colaboradores activos, total vinculados con app móvil (`token_notificacion_push IS NOT NULL` o historial de vínculo) y porcentaje de adopción.
     - **Métricas de Simulaciones:** Total de campañas ejecutadas, total de envíos (`resultados_simulacion`), `tasaAperturaClic` (%), `tasaCompromisoCredenciales` (%) y `tasaReporteTemprano` (% basado en `reportes_usuarios`).
     - **Métricas de Capacitación:** Total de microlecciones completadas vs pendientes asignadas, y tasa de aprobación.
   - **`GET /empresas/:empresaId/analytics/departamentos`:**
     - Desglose comparativo agrupado por `usuarios.departamento` (agrupando nulos/vacíos como `"Sin departamento"`).
     - Por cada área retorna: `departamento`, `totalColaboradores`, `scoreRiesgoPromedio`, `simulacionesRecibidas`, `clicsEnSimulacion`, `credencialesComprometidas`, `tasaVulnerabilidad` (%), `reportesRealizados` y `leccionesCompletadas`.
   - **`GET /empresas/:empresaId/analytics/vectores`:**
     - Efectividad y susceptibilidad agrupada por `plantillas_ataque.metodo_ataque` (`phishing`, `smishing`, `vishing`, `ingenieria_social`).
     - Retorna por vector: `metodoAtaque`, `totalEnvios`, `totalClics`, `totalEnviosCredenciales`, `tasaClic` (%) y `tasaCompromiso` (%).
   - **`GET /empresas/:empresaId/analytics/evolucion`:**
     - Serie temporal mensual (últimos 6 meses por defecto o dentro del rango `desde`/`hasta`) con: `periodo` (`YYYY-MM`), `simulacionesEnviadas`, `incidentesSimulacion` (clics + envíos), `reportesSospechosos` y `leccionesCompletadas`.
   - **`GET /empresas/:empresaId/analytics/usuarios-destacados`:**
     - Dos listas acotadas (Top 5):
       - `mayorRiesgo`: Colaboradores activos con `score_riesgo` más alto y mayor cantidad de fallos en simulaciones (para intervención prioritaria).
       - `mejoresDefensores`: Colaboradores activos con mayor puntaje acumulado en capacitación, mayor cantidad de reportes de phishing y `score_riesgo` más bajo.
   - **`GET /empresas/:empresaId/analytics/exportar`:**
     - Genera un reporte ejecutivo consolidado descargable en formato **CSV** (`Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="reporte-phishwarden-empresa-{id}.csv"`) con el detalle por colaborador (nombre, correo, departamento, score de riesgo, nivel de riesgo, simulaciones fallidas, reportes realizados, lecciones completadas y puntos acumulados).
     - **Protección contra CSV Injection (Formula Injection):** Sanitizar cualquier celda de texto que comience con `=`, `+`, `-`, `@`, `\t` o `\r` anteponiendo un apóstrofe (`'`).

3. **Documentación de Contratos:**
   - Actualizar `specs/API_CONTRACTS.md` con todos los endpoints de `/empresas/:empresaId/analytics/*`, parámetros de consulta y ejemplos JSON/CSV.

### Excluido

- **Fase 6:** Rate limiting global/por ruta con `@nestjs/throttler` y endurecimiento final de producción.
- **Frontend Web (`phishwarden-web-tl/`):** Se implementará en el siguiente paso una vez estabilizados los endpoints del backend.
- Código fuente de la aplicación móvil Flutter.

## Reglas arquitectónicas y de seguridad

1. **Aislamiento Multi-Tenant Absoluto:** Toda consulta SQL/Prisma debe filtrar explícitamente por `empresa_id === empresaId` verificado por `CompanyTenantGuard`.
2. **Coherencia en Escala de Riesgo (`0` a `100`):** `0` representa riesgo nulo/seguro y `100` riesgo crítico. Los indicadores y etiquetas de nivel de riesgo (`bajo`: 0–30, `medio`: 31–69, `critico`: 70–100) deben respetar esta convención.
3. **Prevención de División por Cero:** Todas las tasas porcentuales (`tasaClic`, `tasaCompromiso`, `tasaReporteTemprano`, `tasaVulnerabilidad`) deben devolver `0` cuando el denominador sea `0`, redondeadas a 1 o 2 decimales.
4. **Arquitectura Limpia:** Estructura hexagonal en `src/analytics/` (`domain`, `application`, `infrastructure`, `presentation`) sin lógica SQL directa en los controladores.

## Criterios de aceptación

- Todos los endpoints de `/empresas/:empresaId/analytics/*` operativos y protegidos por `JwtAuthGuard` + `CompanyTenantGuard`.
- Cálculos agregados verificados sin errores de división por cero y respetando `score_riesgo` (`0` = seguro, `100` = crítico).
- Exportación CSV funcional con cabeceras HTTP de descarga y sanitización anti-CSV Injection.
- `specs/API_CONTRACTS.md` actualizado y `npm run build` en `phishwarden-backend-nj/` finaliza con **0 errores**.