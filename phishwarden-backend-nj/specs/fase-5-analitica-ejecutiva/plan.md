# Plan de Implementación — Fase 5: M5 — Módulo de Analítica Ejecutiva, Riesgo Organizacional y Reportes

## 1. Auditoría del Esquema Prisma y Mapeo de Entidades

Tras auditar `prisma/schema.prisma` y los módulos existentes (`src/auth/`, `src/campanas/`, `src/simulaciones/`, `src/mobile/`), se constata la siguiente correspondencia exacta de modelos y campos para las consultas agregadas:

| Concepto de Negocio en Spec | Modelo Real en `prisma/schema.prisma` | Relaciones y Filtro Multi-Tenant | Campos Clave Utilizados |
| :--- | :--- | :--- | :--- |
| **Colaboradores** | `usuarios` | `empresa_id === empresaId` | `id`, `nombre`, `correo_corporativo`, `score_riesgo`, `racha_dias_seguros`, `token_notificacion_push`, `estado`, `departamento_id` |
| **Departamentos** | `departamentos` | `empresa_id === empresaId` | `id`, `nombre` (agrupación de nulos/desvinculados como `"Sin departamento"`) |
| **Campañas** | `campanas` | Vía `plantillas.empresa_id === empresaId` o `campana_usuarios.usuarios.empresa_id === empresaId` | `id`, `nombre`, `estado`, `fecha_programada`, `creado_el`, `plantilla_id` |
| **Plantillas de Ataque** | `plantillas` *(no `plantillas_ataque`)* | `empresa_id === empresaId` | `id`, `metodo_ataque` (`phishing`, `smishing`, `vishing`, `ingenieria_social`) |
| **Eventos de Simulación** | `eventos_simulacion` *(no `resultados_simulacion`)* | `usuarios.empresa_id === empresaId` | `id`, `campana_id`, `usuario_id`, `tipo_evento` (`enviado`, `abierto`, `click`, `formulario_enviado`, `descarga_adjunto`), `fecha_hora` |
| **Reportes de Colaboradores**| `reportes_sospechosos` *(no `reportes_usuarios`)*| `usuarios.empresa_id === empresaId` | `id`, `usuario_id`, `canal`, `remitente`, `asunto`, `url_sospechosa`, `fecha_reporte` |
| **Capacitación y Logros** | `logros_usuarios` | `usuarios.empresa_id === empresaId` | `usuario_id`, `microleccion_id`, `estado` (`pendiente`, `completada`, `reprobada`), `puntos_obtenidos`, `fecha_completado` |
| **Insignias y Medallas** | `medallas_usuarios` | `usuarios.empresa_id === empresaId` | `usuario_id`, `insignia_id`, `fecha_obtencion` |

---

## 2. Arquitectura Clean Architecture del Módulo `src/analytics/`

El módulo se organizará siguiendo estrictamente los principios de Arquitectura Hexagonal y separación de responsabilidades:

```
src/analytics/
├── domain/
│   ├── executive-summary.entity.ts       # Entidades de postura de riesgo, adopción, simulaciones y capacitación
│   ├── department-metrics.entity.ts      # Métricas agregadas por departamento
│   ├── attack-vector-metrics.entity.ts   # Métricas agregadas por vector de ataque
│   ├── evolution-metrics.entity.ts       # Serie temporal mensual de evolución
│   ├── featured-users.entity.ts          # Listas de usuarios de mayor riesgo y mejores defensores
│   └── export-user-row.entity.ts         # Modelo de datos consolidado por colaborador para exportación
├── application/
│   ├── analytics.repository.port.ts      # Interfaz abstracta y token de inyección ANALYTICS_REPOSITORY_PORT
│   ├── get-executive-summary.use-case.ts # Caso de uso para GET /resumen
│   ├── get-department-metrics.use-case.ts# Caso de uso para GET /departamentos
│   ├── get-attack-vector-metrics.use-case.ts # Caso de uso para GET /vectores
│   ├── get-evolution-metrics.use-case.ts # Caso de uso para GET /evolucion
│   ├── get-featured-users.use-case.ts    # Caso de uso para GET /usuarios-destacados
│   └── export-analytics-csv.use-case.ts  # Caso de uso para GET /exportar
├── infrastructure/
│   ├── analytics-date-range.dto.ts       # DTO con validaciones class-validator para ?desde=&hasta=
│   ├── csv-sanitizer.helper.ts           # Utilidad de escape RFC 4180 y prevención de CSV Injection
│   ├── prisma-analytics.repository.ts    # Implementación Prisma con aislamiento estricto y agregaciones
│   └── analytics.controller.ts           # Controlador REST con JwtAuthGuard y CompanyTenantGuard
└── analytics.module.ts                   # Registro del módulo en AppModule
```

---

## 3. Diseño de DTOs de Consulta y Validación de Rango de Fechas

Se creará `AnalyticsDateRangeDto` con validaciones estrictas mediante `class-validator`:

```typescript
export class AnalyticsDateRangeDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (formato YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'El parámetro "desde" debe tener un formato de fecha válido (YYYY-MM-DD)' })
  desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (formato YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'El parámetro "hasta" debe tener un formato de fecha válido (YYYY-MM-DD)' })
  hasta?: string;
}
```

### Reglas de Normalización Temporal
1. Si se proporciona `desde`, se normaliza a inicio del día UTC: `new Date(`${desde}T00:00:00.000Z`)`.
2. Si se proporciona `hasta`, se normaliza al fin del día UTC: `new Date(`${hasta}T23:59:59.999Z`)`.
3. Si ambos están presentes y `desde > hasta`, se lanza `BadRequestException('La fecha "desde" no puede ser posterior a "hasta"')`.
4. Si no se especifican:
   - Para métricas acumuladas (`resumen`, `departamentos`, `vectores`, `usuarios-destacados`, `exportar`), se toma el histórico completo de colaboradores activos.
   - Para `evolucion`, por defecto se calculan los últimos 6 meses naturales hasta el mes corriente.

---

## 4. Estrategia de Consultas Agregadas y Reglas Matemáticas

### 4.1 Reglas Globales de Cálculo
1. **Prevención de División por Cero:**
   Toda función de cálculo de tasa utiliza:
   ```typescript
   function calculateRate(numerator: number, denominator: number): number {
     if (!denominator || denominator <= 0) return 0;
     return Math.round((numerator / denominator) * 1000) / 10; // Redondeo a 1 decimal
   }
   ```
2. **Escala y Nivel de Riesgo Organizacional (`0 = seguro`, `100 = crítico`):**
   ```typescript
   function resolveRiskLevel(score: number): 'bajo' | 'medio' | 'critico' {
     if (score <= 30) return 'bajo';
     if (score <= 69) return 'medio';
     return 'critico';
   }
   ```

---

### 4.2 Estrategia por Cada Endpoint

#### A. `GET /empresas/:empresaId/analytics/resumen`
- **Postura de Riesgo:**
  - Consulta los usuarios activos de la empresa (`estado: 'activo'`).
  - `scoreRiesgoPromedio`: Promedio de `score_riesgo` (redondeado a 1 decimal). Si no hay usuarios, `0`.
  - `nivelRiesgoGlobal`: Clasificación según el promedio (`bajo`, `medio`, `critico`).
  - `distribucion`: Conteo de usuarios activos agrupados en rangos:
    - `bajo`: `0` a `30`
    - `medio`: `31` a `69`
    - `critico`: `70` a `100`
- **Adopción Móvil:**
  - `totalColaboradores`: Total de usuarios activos del tenant.
  - `colaboradoresVinculados`: Usuarios activos con `token_notificacion_push IS NOT NULL`.
  - `tasaAdopcion`: `calculateRate(colaboradoresVinculados, totalColaboradores)`.
- **Métricas de Simulaciones:**
  - Campañas ejecutadas (`estado: 'en_curso'` o `'finalizada'`).
  - Eventos de simulación filtrados por rango de fechas (si aplica):
    - `totalEnvios`: Conteo de eventos `tipo_evento === 'enviado'`.
    - `totalAperturas`: Conteo de eventos `tipo_evento === 'abierto'`.
    - `totalClics`: Conteo de eventos `tipo_evento === 'click'`.
    - `totalEnviosCredenciales`: Conteo de eventos `tipo_evento === 'formulario_enviado'`.
  - Reportes de incidentes (`reportes_sospechosos`) generados por colaboradores de la empresa en el rango.
  - Tasas calculadas:
    - `tasaApertura`: Aperturas / Envíos (%)
    - `tasaClic`: Clics / Envíos (%)
    - `tasaCompromisoCredenciales`: Formularios enviados / Envíos (%)
    - `tasaReporteTemprano`: Reportes sospechosos / Envíos (%)
- **Métricas de Capacitación:**
  - Logros de usuarios (`logros_usuarios`) de la empresa:
    - `totalLeccionesCompletadas`: Conteo con `estado === 'completada'`.
    - `totalLeccionesPendientes`: Conteo con `estado === 'pendiente'`.
    - `totalLeccionesReprobadas`: Conteo con `estado === 'reprobada'`.
    - `tasaAprobacion`: Completadas / (Completadas + Reprobadas) (%).

---

#### B. `GET /empresas/:empresaId/analytics/departamentos`
- Obtiene todos los departamentos del tenant (`departamentos.findMany({ where: { empresa_id: empresaId } })`) y los usuarios activos de la empresa agrupados por `departamento_id`.
- Los colaboradores sin departamento asignado (`departamento_id === null`) se consolidan bajo el grupo con `departamentoId: null` y `departamento: "Sin departamento"`.
- Por cada departamento se calcula:
  - `totalColaboradores`: Conteo de usuarios activos.
  - `scoreRiesgoPromedio`: Promedio de `score_riesgo` de los usuarios del área.
  - `nivelRiesgo`: Clasificación según el promedio.
  - `simulacionesRecibidas`: Total de eventos `'enviado'` dirigidos a usuarios del área.
  - `clicsEnSimulacion`: Total de eventos `'click'` de usuarios del área.
  - `credencialesComprometidas`: Total de eventos `'formulario_enviado'` de usuarios del área.
  - `tasaVulnerabilidad`: `calculateRate(clicsEnSimulacion + credencialesComprometidas, simulacionesRecibidas)`.
  - `reportesRealizados`: Total de reportes en `reportes_sospechosos` creados por usuarios del área.
  - `leccionesCompletadas`: Total de logros con `estado === 'completada'` de usuarios del área.

---

#### C. `GET /empresas/:empresaId/analytics/vectores`
- Analiza la susceptibilidad agrupada por método de ataque predefinido: `phishing`, `smishing`, `vishing`, `ingenieria_social`.
- Cruza `eventos_simulacion` con `campanas.plantillas.metodo_ataque` para el tenant en el rango de fechas.
- Retorna siempre la estructura normalizada para los 4 vectores (incluso si tienen 0 actividad):
  - `metodoAtaque`: Nombre del vector.
  - `totalEnvios`: Total de eventos `'enviado'`.
  - `totalClics`: Total de eventos `'click'`.
  - `totalEnviosCredenciales`: Total de eventos `'formulario_enviado'`.
  - `tasaClic`: Clics / Envíos (%).
  - `tasaCompromiso`: Envíos de credenciales / Envíos (%).

---

#### D. `GET /empresas/:empresaId/analytics/evolucion`
- Construye la serie temporal mensual (últimos 6 meses hasta el mes actual por defecto, o los meses comprendidos entre `desde` y `hasta`).
- Agrupa por `YYYY-MM`:
  - `simulacionesEnviadas`: Eventos `'enviado'` en ese mes.
  - `incidentesSimulacion`: Suma de eventos `'click'` y `'formulario_enviado'` en ese mes.
  - `reportesSospechosos`: Reportes creados en ese mes.
  - `leccionesCompletadas`: Logros completados en ese mes.

---

#### E. `GET /empresas/:empresaId/analytics/usuarios-destacados`
Retorna dos listas de Top 5 colaboradores activos:
1. `mayorRiesgo` (Intervención prioritaria):
   - Orden: `score_riesgo DESC`, fallos en simulaciones (clics + credenciales) DESC, `nombre ASC`.
   - Campos: `id`, `nombre`, `correo`, `departamento`, `scoreRiesgo`, `nivelRiesgo`, `simulacionesFallidas`.
2. `mejoresDefensores` (Líderes de seguridad):
   - Orden: Puntos de capacitación DESC, reportes de incidentes DESC, `score_riesgo ASC`, `nombre ASC`.
   - Campos: `id`, `nombre`, `correo`, `departamento`, `puntosCapacitacion`, `reportesRealizados`, `scoreRiesgo`, `rachaDiasSeguros`.

---

#### F. `GET /empresas/:empresaId/analytics/exportar`
- Genera un archivo CSV descargable con el detalle consolidado de todos los colaboradores activos del tenant.
- **Cabeceras HTTP en NestJS:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="reporte-phishwarden-empresa-{empresaId}.csv"`
- **Estructura y Formato del CSV:**
  - Comienza con el marcador Byte Order Mark UTF-8 (`\uFEFF`) para compatibilidad perfecta con Microsoft Excel.
  - Columnas:
    `"ID Colaborador","Nombre","Correo Electrónico","Departamento","Score de Riesgo","Nivel de Riesgo","Simulaciones Recibidas","Clics en Enlace","Credenciales Comprometidas","Reportes Sospechosos","Lecciones Completadas","Puntos Acumulados","Estado App Móvil"`
- **Blindaje contra Inyección de Fórmulas (CSV Injection):**
  - Todo campo de texto que inicie con `=`, `+`, `-`, `@`, `\t` o `\r` se desinfecta anteponiendo un apóstrofe `'` (`'=` ...).
  - Todo campo se escapa entre comillas dobles según RFC 4180 (duplicando comillas internas `"` -> `""`).

---

## 5. Control de Acceso y Seguridad

1. **Protección de Rutas:**
   - Todo endpoint bajo `@Controller('empresas/:empresaId/analytics')` está protegido con `@UseGuards(JwtAuthGuard, CompanyTenantGuard)`.
   - `CompanyTenantGuard` verifica que el usuario autenticado posea rol `'administrador'` y que su `empresaId` coincida exactamente con el parámetro `:empresaId` de la URL. Si hay discrepancia, responde `403 Forbidden`.
2. **Aislamiento en Base de Datos:**
   - Cada método de repositorio recibe explícitamente `empresaId: number` y todas las cláusulas Prisma aplican filtros anidados sobre `empresa_id`.

---

## 6. Verificación y Criterios de Aceptación

1. Pruebas de compilación TypeScript (`nest build`) con 0 errores y 0 advertencias de tipos.
2. Contratos documentados exhaustivamente en `specs/API_CONTRACTS.md` con ejemplos de peticiones y respuestas JSON y CSV.
3. Cero modificaciones al frontend web ni a la aplicación móvil Flutter.
