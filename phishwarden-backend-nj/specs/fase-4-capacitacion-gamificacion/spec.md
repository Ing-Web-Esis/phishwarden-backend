# Fase 4: M4 — Módulo de Capacitación Predefinida, Evaluaciones, Gamificación y Ranking

## Objetivo

Implementar en `phishwarden-backend-nj/` el módulo de capacitación y gamificación móvil (**M4**) reutilizando las tablas existentes del esquema Prisma (`microlecciones`, `preguntas_evaluacion`, `logros_usuarios`, `insignias_medallas`, `medallas_usuarios`). Todo el contenido educativo e insignias estará predefinido en base de datos mediante seed SQL (sin CRUD administrativo web), permitiendo al colaborador completar tanto microlecciones asignadas tras simulaciones como microlecciones generales voluntarias, desbloquear medallas y competir en un ranking interno de su empresa.

## Alcance

### Incluido

1. **Contenido Predefinido (*Seed* Idempotente SQL en `supabase/migrations/`):**
   - Poblar `microlecciones` y `preguntas_evaluacion` con un catálogo predefinido completo (al menos 6 microlecciones: 4 orientadas a vectores de ataque específicos como `phishing`, `smishing`, `vishing`, `ingenieria_social` para asignación reactiva, y 2+ cápsulas generales de phishing disponibles para aprendizaje voluntario), cada una con 3 preguntas (`opcion_a`..`opcion_d`, `respuesta_correcta` `'A'|'B'|'C'|'D'`).
   - Poblar `insignias_medallas` con 4 a 5 medallas progresivas según `puntos_requeridos` (ej. `10`, `30`, `60`, `100`, `150` puntos).
   - Verificar que los estados insertados en `logros_usuarios` respeten exactamente el constraint `CHECK` de PostgreSQL.

2. **Asignación Reactiva tras Simulación (Integración Fase 2):**
   - Cuando un colaborador cae en una simulación (`TrackClickUseCase` o `TrackSubmitUseCase`), buscar una microlección predefinida acorde al `metodo_ataque` de la campaña (o una general de phishing si no hay coincidencia exacta) que el colaborador aún no haya completado, e insertar/mantener un registro en `logros_usuarios` con `estado = 'pendiente'` y `puntos_obtenidos = 0`.
   - Ejecutar esta asignación de forma **no bloqueante** para no afectar los tiempos de respuesta de `/track/click` ni `/track/submit`.

3. **Endpoints Móviles de Capacitación y Evaluaciones (`EmployeeJwtGuard`):**
   - **`GET /mobile/lecciones`:**
     - Lista todas las microlecciones predefinidas clasificadas o etiquetadas según su estado para el colaborador autenticado:
       - `asignadasPendientes`: Microlecciones en `logros_usuarios` con `estado = 'pendiente'` o `'reprobada'` (asignadas tras simulación).
       - `catalogoDisponible`: Resto de microlecciones generales y de vectores de ataque que el usuario puede tomar voluntariamente en cualquier momento para sumar más puntos (`estado = 'disponible'`).
       - `completadas`: Microlecciones ya aprobadas (`estado = 'completada'`, con `puntosObtenidos` y `fechaCompletado`).
   - **`GET /mobile/lecciones/:id`:**
     - Devuelve el contenido completo de la microlección (`id`, `titulo`, `metodoAtaque`, `contenidoMultimedia`, `duracionMinutos`, `puntosRecompensa`, `estadoUsuario`) y sus `preguntas_evaluacion` (`id`, `enunciado`, `opcionA`, `opcionB`, `opcionC`, `opcionD`) **omitiendo estrictamente `respuesta_correcta`**.
   - **`POST /mobile/lecciones/:id/evaluar`:**
     - Recibe `{ respuestas: Array<{ preguntaId: number, respuestaSeleccionada: 'A' | 'B' | 'C' | 'D' }> }`.
     - Califica en el servidor comparando contra `preguntas_evaluacion.respuesta_correcta`.
     - Si aprueba (**>= 70%** de aciertos):
       - Actualiza/crea en `logros_usuarios` con `estado = 'completada'`, `puntos_obtenidos = microleccion.puntos_recompensa` y `fecha_completado = NOW()`.
       - Si es la primera vez que aprueba esa lección (anti-farming), reduce `usuarios.score_riesgo` (ej. `-10` puntos, acotado con piso mínimo en `0`).
       - Calcula los `puntosTotales` acumulados del colaborador y desbloquea automáticamente en `medallas_usuarios` todas las `insignias_medallas` cuyo `puntos_requeridos <= puntosTotales` que aún no posea.
     - Si reprueba (**< 70%**):
       - Registra `estado = 'reprobada'` y `puntos_obtenidos = 0` (si no estaba ya `'completada'`), permitiendo reintentar la evaluación.
     - Retorna `{ aprobado, porcentajeAciertos, correctas, totalPreguntas, puntosGanados, puntosTotales, scoreRiesgoActualizado, nuevasMedallasDesbloqueadas }`.

4. **Endpoints Móviles de Medallas, Ranking y Perfil (`EmployeeJwtGuard`):**
   - **`GET /mobile/medallas`:** Devuelve todo el catálogo de `insignias_medallas` indicando cuáles tiene desbloqueadas el colaborador (`desbloqueada: boolean`, `fechaObtencion`) junto con sus `puntosTotales`.
   - **`GET /mobile/ranking`:**
     - Devuelve el ranking interno de los colaboradores activos pertenecientes a la **misma empresa** (`empresaId` extraído del JWT, estricto aislamiento multi-tenant).
     - Ordenamiento: `puntosTotales` DESC, `rachaDiasSeguros` DESC, `scoreRiesgo` ASC, `nombre` ASC.
     - Retorna la lista con `{ posicion, usuarioId, nombre, departamento, puntosTotales, medallasCount, rachaDiasSeguros, scoreRiesgo, esUsuarioActual }` además de la posición exacta del colaborador autenticado (`miPosicion`).
   - **Enriquecimiento de `GET /mobile/perfil`:** Incluir `puntosTotales`, `leccionesCompletadas`, `leccionesPendientes`, `medallasObtenidas` y `posicionRanking` en la respuesta del perfil móvil.

5. **Documentación de Contratos:**
   - Actualizar `specs/API_CONTRACTS.md` con todos los endpoints móviles de la Fase 4 (`/mobile/lecciones`, `/mobile/lecciones/:id`, `/mobile/lecciones/:id/evaluar`, `/mobile/medallas`, `/mobile/ranking` y actualización de `/mobile/perfil`).

### Excluido

- **Endpoints administrativos web de microlecciones/preguntas/insignias:** No se crean rutas `/empresas/:empresaId/microlecciones` ni UI de edición; el contenido es predefinido por la plataforma.
- **Fase 5 (M5):** Endpoints de analítica ejecutiva (`/analytics/*`).
- **Fase 6:** Rate limiting con `@nestjs/throttler`.
- Cambios en el frontend web (`phishwarden-web-tl/`) y código fuente de la app Flutter.

## Reglas arquitectónicas y de seguridad

1. **Aislamiento Multi-Tenant en Ranking:** `GET /mobile/ranking` debe filtrar estrictamente por `usuarios.empresa_id === req.user.empresaId` y `estado === 'activo'`. Nunca exponer usuarios de otras empresas.
2. **Integridad de Evaluaciones:** `GET /mobile/lecciones/:id` jamás debe enviar `respuesta_correcta`; la calificación ocurre exclusivamente en el servidor.
3. **Anti-Farming:** Re-aprobar una microlección ya completada no otorga puntos adicionales ni vuelve a reducir `score_riesgo`.
4. **Escala coherente de `score_riesgo` (`0` a `100`):** `0` es seguro (valor inicial), caer en simulación suma puntos (tope `100`), y aprobar una microlección por primera vez reduce `score_riesgo` (piso `0`).

## Criterios de aceptación

- Seed SQL ejecutado con microlecciones (reactivas + generales), preguntas e insignias iniciales listas.
- Al caer en una simulación (`GET /track/click/:token` o `POST /track/submit/:token`), se asigna una microlección `'pendiente'` en `logros_usuarios`.
- `GET /mobile/lecciones` separa claramente lecciones asignadas pendientes, catálogo general disponible y completadas.
- `GET /mobile/lecciones/:id` oculta `respuesta_correcta` y `POST /mobile/lecciones/:id/evaluar` califica, reduce `score_riesgo` (piso `0`) y desbloquea medallas en `medallas_usuarios`.
- `GET /mobile/medallas` y `GET /mobile/ranking` funcionan filtrando por la empresa del colaborador.
- `specs/API_CONTRACTS.md` actualizado y `npm run build` en `phishwarden-backend-nj/` finaliza con **0 errores**.