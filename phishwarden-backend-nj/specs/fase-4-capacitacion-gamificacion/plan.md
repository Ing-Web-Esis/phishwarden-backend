# Plan de Implementación — Fase 4: M4 — Módulo de Capacitación Predefinida, Evaluaciones, Gamificación y Ranking

## 1. Contexto y Objetivos

El objetivo de la **Fase 4 (M4)** es implementar en `phishwarden-backend-nj/` el ecosistema completo de capacitación predefinida, evaluaciones defensivas, gamificación mediante insignias y ranking de colaboradores para la aplicación móvil Flutter.

### Reglas Rectoras
1. **Sin CRUD Administrativo Web:** Todo el contenido educativo (microlecciones, preguntas de evaluación e insignias/medallas) viene precargado de forma estandarizada en la base de datos mediante un script SQL de *seed* idempotente. No se crean pantallas de administración ni endpoints web de edición para microlecciones.
2. **Aislamiento Multi-Tenant Estricto:** Los colaboradores móviles acceden mediante un token JWT con `role: 'EMPLOYEE'` y `empresaId`. Las consultas de ranking y métricas se aíslan estrictamente por `empresa_id`.
3. **Zero-Credential e Integridad de Evaluaciones:** Las preguntas expuestas en `GET /mobile/lecciones/:id` omiten estrictamente la columna `respuesta_correcta`. La calificación ocurre exclusivamente en el servidor.
4. **Anti-Farming y Escala de Riesgo Coherente:**
   - La escala de `score_riesgo` va de `0` (seguro) a `100` (crítico).
   - Aprobar una microlección por primera vez (aciertos >= 70%) reduce `-10` puntos de `score_riesgo` con piso mínimo garantizado en `0`.
   - Re-aprobar una microlección completada no vuelve a restar riesgo ni otorga puntos adicionales duplicados.
5. **Asignación Reactiva No Bloqueante:** Cuando un colaborador cae en una simulación de phishing o smishing, se le asigna de forma reactiva una microlección `'pendiente'` sin bloquear ni demorar las respuestas HTTP de rastreo.

---

## 2. Esquema de Base de Datos y Seed SQL Idempotente

### 2.1. Ajuste de Constraints en `logros_usuarios`
En el DDL original de `phishwarden.sql`:
```sql
estado VARCHAR(20) CHECK (estado IN ('completada', 'reprobada')),
fecha_completado TIMESTAMPTZ DEFAULT NOW(),
```
Para soportar la asignación reactiva con estado `'pendiente'` y registrar `fecha_completado` únicamente cuando la lección se culmine con éxito, la migración ejecutará:
```sql
ALTER TABLE logros_usuarios DROP CONSTRAINT IF EXISTS logros_usuarios_estado_check;
ALTER TABLE logros_usuarios ADD CONSTRAINT logros_usuarios_estado_check CHECK (estado IN ('pendiente', 'completada', 'reprobada'));
ALTER TABLE logros_usuarios ALTER COLUMN fecha_completado DROP DEFAULT;
```

### 2.2. Catálogo de Microlecciones Predefinidas (Seed SQL)
Se sembrarán al menos 6 microlecciones:
- **4 Reactivas por Vector de Ataque:**
  1. `phishing`: *"Identificación de Phishing por Correo Electrónico"* (duración: 2 min, recompensa: 10 pts).
  2. `smishing`: *"Protección contra Smishing y Mensajería SMS Fraudulenta"* (duración: 2 min, recompensa: 10 pts).
  3. `vishing`: *"Ingeniería Social Telefónica y Vishing"* (duración: 3 min, recompensa: 15 pts).
  4. `ingenieria_social`: *"Pretexting y Manipulación Psicológica en el Trabajo"* (duración: 3 min, recompensa: 15 pts).
- **2 Voluntarias / Generales:**
  5. `general`: *"Fundamentos de Ciberseguridad y Enlaces Maliciosos"* (duración: 2 min, recompensa: 10 pts).
  6. `general`: *"Gestión Segura de Contraseñas y Doble Factor (2FA)"* (duración: 2 min, recompensa: 10 pts).

### 2.3. Preguntas de Evaluación
Cada una de las 6 microlecciones contará con 3 preguntas de opción múltiple (`opcion_a` .. `opcion_d`) con `respuesta_correcta` obligatoria (`'A' | 'B' | 'C' | 'D'`), totalizando 18 preguntas con distractores realistas basados en ingeniería social real.

### 2.4. Insignias y Medallas Progresivas
Se sembrarán 5 insignias con iconos identificadores:
1. **Novato Consciente** (10 pts requeridos, icono: `shield-alert`, descripción: *"Completa tu primera microlección de ciberseguridad."*).
2. **Guardián Digital** (30 pts requeridos, icono: `shield-check`, descripción: *"Alcanza 30 puntos en entrenamientos defensivos."*).
3. **Ojo Crítico** (60 pts requeridos, icono: `eye`, descripción: *"Alcanza 60 puntos dominando la detección de fraudes."*).
4. **Especialista Antifraude** (100 pts requeridos, icono: `award`, descripción: *"Alcanza 100 puntos y conviértete en un referente de seguridad."*).
5. **Centinela PhishWarden** (150 pts requeridos, icono: `crown`, descripción: *"Maestría total: 150 puntos en defensa contra amenazas cibernéticas."*).

### 2.5. Idempotencia
La migración residirá en `phishwarden-backend-nj/supabase/migrations/20261121_fase4_capacitacion_gamificacion_seed.sql`, empleando cláusulas `WHERE NOT EXISTS` para que su ejecución repetida sea 100% segura. Se sincronizará además el archivo de referencia `phishwarden-backend/phishwarden.sql`.

---

## 3. Integración Reactiva en Simulaciones (`src/simulaciones/`)

1. **Caso de Uso `AssignReactiveLessonUseCase`:**
   - Inyectado en `SimulacionesModule` importando `MobileModule`.
   - Flujo:
     - Dado un `usuarioId` y el `plantillaMetodoAtaque` de la campaña.
     - Busca primero una microlección específica del método de ataque (`phishing`, `smishing`, etc.) que el usuario **no haya completado** aún (`logros_usuarios.estado != 'completada'`).
     - Si el usuario ya completó todas las específicas de ese vector, busca una microlección de categoría `'general'` sin completar.
     - Si halla una lección disponible:
       - Si no existe registro en `logros_usuarios`, crea uno con `estado = 'pendiente'`, `puntos_obtenidos = 0`, `fecha_completado = null`.
       - Si existe en estado `'reprobada'`, lo actualiza a `'pendiente'` para motivar el reintento.
       - Si ya estaba `'pendiente'`, no altera el registro.
2. **Ejecución Asíncrona No Bloqueante:**
   - En `TrackClickUseCase` y `TrackSubmitUseCase`, se invoca la asignación mediante promesa no bloqueante con captura de errores en log (`.catch(err => this.logger.error(...))`), preservando los tiempos de respuesta del tracking.

---

## 4. Endpoints y Casos de Uso Móviles (`src/mobile/`)

Todos los endpoints están protegidos por `EmployeeJwtGuard` (requiere `role: 'EMPLOYEE'`).

### 4.1. `GET /mobile/lecciones`
- **Caso de Uso:** `GetMobileLessonsUseCase`
- **Comportamiento:**
  - Consulta todas las microlecciones ordenadas por `id ASC`.
  - Cruza con `logros_usuarios` para el `usuarioId` autenticado.
  - Clasifica en:
    - `asignadasPendientes`: Lecciones con registro en `logros_usuarios` en estado `'pendiente'` o `'reprobada'`.
    - `catalogoDisponible`: Lecciones sin registro en `logros_usuarios` (disponibles para entrenamiento voluntario, `estado = 'disponible'`).
    - `completadas`: Lecciones en `logros_usuarios` con `estado = 'completada'`, proyectando `puntosObtenidos` y `fechaCompletado`.
- **Respuesta:** 200 OK con `{ asignadasPendientes: [], catalogoDisponible: [], completadas: [] }`.

### 4.2. `GET /mobile/lecciones/:id`
- **Caso de Uso:** `GetMobileLessonDetailUseCase`
- **Parámetro:** `:id` (INT, `ParseIntPipe`).
- **Seguridad:** Oculta estrictamente `respuesta_correcta` de `preguntas_evaluacion`.
- **Comportamiento:** Devuelve la lección, sus 3 preguntas (`id`, `enunciado`, `opcionA`, `opcionB`, `opcionC`, `opcionD`) y el `estadoUsuario` actual (`'disponible' | 'pendiente' | 'reprobada' | 'completada'`). Si no existe, responde 404 Not Found.

### 4.3. `POST /mobile/lecciones/:id/evaluar`
- **Caso de Uso:** `EvaluateMobileLessonUseCase`
- **Parámetro:** `:id` (INT, `ParseIntPipe`).
- **Payload:** `EvaluateLessonDto` (`respuestas: [{ preguntaId: number, respuestaSeleccionada: 'A' | 'B' | 'C' | 'D' }]`).
- **Lógica de Calificación en Servidor:**
  1. Carga las preguntas de la lección con su `respuesta_correcta` real.
  2. Compara cada respuesta enviada contra la respuesta oficial.
  3. Calcula `porcentajeAciertos = Math.round((correctas / totalPreguntas) * 100)`.
  4. Determina si aprueba (`aprobado = porcentajeAciertos >= 70`).
  5. **Si aprueba:**
     - Verifica si el usuario ya tenía la lección en estado `'completada'` (`wasAlreadyCompleted`).
     - Actualiza o crea el registro en `logros_usuarios` con `estado = 'completada'`, `puntos_obtenidos = microleccion.puntos_recompensa` y `fecha_completado = new Date()`.
     - **Anti-Farming:**
       - Si `!wasAlreadyCompleted`:
         - Otorga puntos: `puntosGanados = microleccion.puntos_recompensa`.
         - Disminuye `score_riesgo`: `nuevoScore = Math.max(0, (usuario.score_riesgo ?? 0) - 10)`. Actualiza `usuarios.score_riesgo`.
       - Si `wasAlreadyCompleted`:
         - `puntosGanados = 0` (no se otorgan puntos duplicados ni se vuelve a restar riesgo).
     - Calcula `puntosTotales` acumulados del colaborador (sumatoria de `logros_usuarios.puntos_obtenidos` en lecciones completadas).
     - **Desbloqueo de Medallas:**
       - Busca en `insignias_medallas` todas las medallas con `puntos_requeridos <= puntosTotales` que el usuario **no posea** en `medallas_usuarios`.
       - Inserta las nuevas en `medallas_usuarios` con `fecha_obtencion = new Date()`.
       - Recolecta `nuevasMedallasDesbloqueadas`.
  6. **Si reprueba:**
     - Si no estaba previamente completada, upsert en `logros_usuarios` con `estado = 'reprobada'`, `puntos_obtenidos = 0`.
     - `puntosGanados = 0`, `nuevasMedallasDesbloqueadas = []`.
- **Respuesta:** 200 OK con:
  ```json
  {
    "aprobado": true,
    "porcentajeAciertos": 100,
    "correctas": 3,
    "totalPreguntas": 3,
    "puntosGanados": 10,
    "puntosTotales": 40,
    "scoreRiesgoActualizado": 0,
    "nuevasMedallasDesbloqueadas": [
      {
        "id": 2,
        "nombre": "Guardián Digital",
        "descripcion": "Alcanza 30 puntos en entrenamientos defensivos.",
        "iconoUrl": "shield-check",
        "puntosRequeridos": 30
      }
    ]
  }
  ```

### 4.4. `GET /mobile/medallas`
- **Caso de Uso:** `GetMobileBadgesUseCase`
- **Comportamiento:**
  - Obtiene todas las `insignias_medallas` ordenadas por `puntos_requeridos ASC`.
  - Obtiene las medallas desbloqueadas por el colaborador en `medallas_usuarios`.
  - Calcula `puntosTotales`.
  - Devuelve cada insignia con `desbloqueada: boolean` y `fechaObtencion: string | null`.

### 4.5. `GET /mobile/ranking`
- **Caso de Uso:** `GetMobileRankingUseCase`
- **Comportamiento:**
  - Extrae `empresaId` del token JWT (`req.user.empresaId`).
  - Consulta los usuarios activos de dicha empresa (`empresa_id = empresaId`, `estado = 'activo'`).
  - Para cada colaborador calcula:
    - `puntosTotales`: suma de `puntos_obtenidos` en `logros_usuarios` (`estado = 'completada'`).
    - `medallasCount`: conteo de `medallas_usuarios`.
    - `rachaDiasSeguros`: `usuarios.racha_dias_seguros ?? 0`.
    - `scoreRiesgo`: `usuarios.score_riesgo ?? 0`.
  - Ordenamiento determinista:
    1. `puntosTotales` DESC
    2. `rachaDiasSeguros` DESC
    3. `scoreRiesgo` ASC (menor riesgo es mejor)
    4. `nombre` ASC
  - Asigna `posicion` secuencial (1, 2, 3...) e identifica `esUsuarioActual` y `miPosicion`.
- **Respuesta:** 200 OK con `{ miPosicion: number, ranking: RankingItem[] }`.

### 4.6. Enriquecimiento de `GET /mobile/perfil`
- **Caso de Uso:** `GetMobileProfileUseCase` (actualización)
- **Campos adicionados:**
  - `puntosTotales`: suma acumulada de puntos por microlecciones aprobadas.
  - `leccionesCompletadas`: cantidad de lecciones en `logros_usuarios` con `estado = 'completada'`.
  - `leccionesPendientes`: cantidad de lecciones asignadas pendientes o reprobadas.
  - `medallasObtenidas`: cantidad de insignias desbloqueadas en `medallas_usuarios`.
  - `posicionRanking`: posición actual del colaborador en el ranking de su empresa.

---

## 5. Diseño de Componentes Hexagonales

```
src/mobile/
├── application/
│   ├── assign-reactive-lesson.use-case.ts
│   ├── evaluate-mobile-lesson.use-case.ts
│   ├── get-mobile-badges.use-case.ts
│   ├── get-mobile-lesson-detail.use-case.ts
│   ├── get-mobile-lessons.use-case.ts
│   ├── get-mobile-profile.use-case.ts  (actualizado)
│   ├── get-mobile-ranking.use-case.ts
│   └── mobile.repository.port.ts       (actualizado con nuevos métodos)
├── domain/
│   ├── mobile-badge.entity.ts
│   ├── mobile-lesson.entity.ts
│   └── mobile-ranking.entity.ts
└── infrastructure/
    ├── evaluate-lesson.dto.ts
    ├── mobile.controller.ts            (actualizado con 5 nuevos endpoints)
    └── prisma-mobile.repository.ts     (implementación de transacciones y queries)
```

---

## 6. Verificación y Validación

1. **Ejecución SQL:** `npx prisma db execute --file supabase/migrations/20261121_fase4_capacitacion_gamificacion_seed.sql` ejecutado exitosamente y `npx prisma generate` completado.
2. **Compilación TypeScript:** `npm run build` en `phishwarden-backend-nj/` con **0 errores**.
3. **Contratos Documentados:** `specs/API_CONTRACTS.md` actualizado con los endpoints de la Fase 4.
4. **Respeto de Restricciones:** No tocar código del frontend ni modificar archivos fuera de `phishwarden-backend-nj/`.
