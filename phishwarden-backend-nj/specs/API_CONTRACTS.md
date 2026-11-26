# Contratos API de PhishWarden Backend

## Convenciones generales

- **Base URL local:** `http://localhost:3000`
- **Documentación Swagger:** `/api/docs` con soporte global `Bearer JWT` (`addBearerAuth()`).
- **Aislamiento Multi-tenant y Blindaje JWT (Fase 0):**
  - Toda ruta administrativa bajo `/empresas/:empresaId/...` está estrictamente protegida por `JwtAuthGuard` y `CompanyTenantGuard`.
  - Requiere el encabezado: `Authorization: Bearer <JWT>`.
  - `CompanyTenantGuard` valida que el `empresaId` del token JWT coincida exactamente con el `:empresaId` de la URL. Si difiere o no es administrador, rechaza inmediatamente con `403 Forbidden`.
  - Si el token está ausente, malformado o expirado, `JwtAuthGuard` rechaza con `401 Unauthorized`.
- **Identificadores y Pipes de Validación:**
  - **INT / SERIAL (`ParseIntPipe`):** `empresaId`, `departamentos.id`, `plantillas.id`.
  - **UUIDv4 (`ParseUUIDPipe`):** `usuarios.id`, `campanas.id`.
- **Paginación objetivo:** `{ data, total, page, limit }`.
- **Rutas Públicas Autorizadas:** `POST /auth/login`, `POST /empresas/register`, y los endpoints de rastreo público de simulación `GET /track/open/:token`, `GET /track/click/:token`, `GET /track/context/:token`, `POST /track/submit`.

---

## Raíz

### `GET /`

- **Protección:** Ninguna (Pública).
- **Respuesta:** 200 OK con texto `Hello World!`.

---

## Auth

### `POST /auth/login`

- **Protección:** Pública.
- **Payload:** `LoginDto`

```json
{
  "email": "admin@phishwarden.com",
  "password": "Admin123*",
  "codigoEmpresa": "SALA2026"
}
```

- `password` es opcional para colaboradores móviles; `codigoEmpresa` es opcional para administradores web.
- **Respuesta:** 201 Created; token JWT (`access_token`) con `{ sub, role, empresaId }` y datos de usuario.
- **Errores:** 401 Unauthorized (credenciales inválidas o faltan parámetros).

### `GET /auth/me`

- **Protección:** `JwtAuthGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Respuesta:** 200 OK con perfil del administrador autenticado, incluyendo el código de acceso institucional en la empresa vinculada:
  ```json
  {
    "id": "1",
    "nombre": "Carlos Administrador",
    "correo": "carlos.admin@techcorp.com",
    "empresaId": 1,
    "empresa": {
      "id": 1,
      "nombre": "TechCorp Perú S.A.C.",
      "codigoAcceso": "PW9X2A81"
    }
  }
  ```
- **Errores:** 401 Unauthorized (token ausente o expirado).

### `PUT /auth/me`

- **Protección:** `JwtAuthGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Payload:** `UpdateAdminProfileDto`

```json
{
  "nombre": "María García",
  "correo": "maria.garcia@interbank.pe",
  "nombreEmpresa": "Interbank",
  "contraseñaActual": "Admin123*",
  "nuevaContraseña": "NuevaAdmin123*"
}
```

- **Respuesta:** 200 OK con perfil actualizado.
- **Errores:** 400 Bad Request (datos inválidos); 401 Unauthorized (contraseña actual o token inválido).

---

## Empresas

### `POST /empresas/register`

- **Protección:** Pública (Registro inicial de organización y su administrador principal).
- **Payload:** `RegisterCompanyDto`

```json
{
  "companyName": "TechCorp Perú S.A.C.",
  "adminName": "Carlos Administrador",
  "adminEmail": "carlos.admin@techcorp.com",
  "password": "AdminPass2026*",
  "plan": "professional"
}
```

- **Restricciones:** Email corporativo válido; contraseña mínimo 8 caracteres; plan opcional (`essential` | `professional` | `enterprise`, por defecto `professional`).
- **Respuesta:** 201 Created.
  ```json
  {
    "message": "Administrador registrado exitosamente.",
    "empresa": {
      "id": 1,
      "nombre": "TechCorp Perú S.A.C.",
      "codigoAcceso": "PW9X2A81",
      "plan": "professional"
    },
    "administrador": {
      "id": 1,
      "nombre": "Carlos Administrador",
      "correo": "carlos.admin@techcorp.com"
    }
  }
  ```
- **Errores:** 400 Bad Request; 409 Conflict (correo ya registrado).

### `GET /empresas/:empresaId`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Comportamiento:** Devuelve los datos de la organización del administrador autenticado, exponiendo `codigoAcceso` para compartirlo con los colaboradores que usarán la aplicación móvil y el plan de suscripción activo.
- **Respuesta:** 200 OK
  ```json
  {
    "id": 1,
    "nombre": "TechCorp Perú S.A.C.",
    "codigoAcceso": "PW9X2A81",
    "plan": "professional",
    "fechaCreacion": "2026-10-01T12:00:00.000Z"
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden (organización ajena o token de empleado); 404 Not Found.

### `PATCH /empresas/:empresaId`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `UpdateCompanyDto`
  ```json
  {
    "nombre": "TechCorp Perú S.A.C."
  }
  ```
- **Comportamiento:** Actualiza el nombre corporativo de la organización perteneciente al administrador autenticado.
- **Respuesta:** 200 OK
  ```json
  {
    "id": 1,
    "nombre": "TechCorp Perú S.A.C.",
    "codigoAcceso": "PW9X2A81",
    "fechaCreacion": "2026-10-01T12:00:00.000Z"
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /empresas/:empresaId/regenerar-codigo`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** Ninguno.
- **Comportamiento:** Genera un nuevo código alfanumérico institucional único de 8 caracteres (`PWXXXXXX`) y lo actualiza en base de datos.
- **Respuesta:** 200 OK
  ```json
  {
    "id": 1,
    "nombre": "TechCorp Perú S.A.C.",
    "codigoAcceso": "PW8Y9K23",
    "mensaje": "Código de acceso regenerado exitosamente"
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found.

---

## Departamentos

### `GET /empresas/:empresaId/departamentos`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Respuesta:** 200 OK con lista de departamentos de la empresa.
- **Errores:** 401 Unauthorized; 403 Forbidden (no pertenece a la empresa).

### `POST /empresas/:empresaId/departamentos`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `CreateDepartmentDto`

```json
{
  "nombre": "Recursos Humanos"
}
```

- **Respuesta:** 201 Created con departamento creado.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

---

## Capacitación y Gamificación Móvil (Fase 4)

### `GET /mobile/lecciones`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve todas las microlecciones educativas de la plataforma clasificadas según el estado de progreso del colaborador autenticado (`asignadasPendientes`, `catalogoDisponible` y `completadas`).
- **Respuesta:** 200 OK
  ```json
  {
    "asignadasPendientes": [
      {
        "id": 1,
        "titulo": "Identificación de Phishing por Correo Electrónico",
        "metodoAtaque": "phishing",
        "contenidoMultimedia": "https://images.unsplash.com/photo-1563986768609-322da13575f3",
        "duracionMinutos": 2,
        "puntosRecompensa": 10,
        "estado": "pendiente"
      }
    ],
    "catalogoDisponible": [
      {
        "id": 5,
        "titulo": "Fundamentos de Ciberseguridad y Enlaces Maliciosos",
        "metodoAtaque": "general",
        "contenidoMultimedia": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7",
        "duracionMinutos": 2,
        "puntosRecompensa": 10,
        "estado": "disponible"
      }
    ],
    "completadas": [
      {
        "id": 2,
        "titulo": "Protección contra Smishing y Mensajería SMS Fraudulenta",
        "metodoAtaque": "smishing",
        "contenidoMultimedia": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
        "duracionMinutos": 2,
        "puntosRecompensa": 10,
        "estado": "completada",
        "puntosObtenidos": 10,
        "fechaCompletado": "2026-11-21T21:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /mobile/lecciones/:id`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `id` (INT, `ParseIntPipe`).
- **Comportamiento:** Devuelve el contenido de la microlección, su estado actual para el usuario (`estadoUsuario`) y sus preguntas de evaluación. **Omite estrictamente `respuesta_correcta`**.
- **Respuesta:** 200 OK
  ```json
  {
    "id": 1,
    "titulo": "Identificación de Phishing por Correo Electrónico",
    "metodoAtaque": "phishing",
    "contenidoMultimedia": "https://images.unsplash.com/photo-1563986768609-322da13575f3",
    "duracionMinutos": 2,
    "puntosRecompensa": 10,
    "estadoUsuario": "pendiente",
    "preguntas": [
      {
        "id": 1,
        "enunciado": "¿Cuál es la señal más clara de que un correo entrante puede ser un intento de phishing?",
        "opcionA": "Urgencia extrema exigiendo ingresar credenciales y discrepancia en el dominio del remitente",
        "opcionB": "El correo fue enviado durante el horario habitual de oficina",
        "opcionC": "El remitente incluye el logotipo oficial de la empresa en la cabecera",
        "opcionD": "El correo no contiene ningún archivo adjunto ni hipervínculo"
      }
    ]
  }
  ```
- **Errores:** 400 Bad Request (parámetro id inválido); 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /mobile/lecciones/:id/evaluar`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `id` (INT, `ParseIntPipe`).
- **Payload:** `EvaluateLessonDto`
  ```json
  {
    "respuestas": [
      {
        "preguntaId": 1,
        "respuestaSeleccionada": "A"
      },
      {
        "preguntaId": 2,
        "respuestaSeleccionada": "B"
      },
      {
        "preguntaId": 3,
        "respuestaSeleccionada": "B"
      }
    ]
  }
  ```
- **Comportamiento:** Califica las respuestas en el servidor (umbral >= 70%). Si aprueba por primera vez, reduce -10 puntos de `score_riesgo` (piso mínimo en 0), suma los puntos de recompensa y desbloquea automáticamente en `medallas_usuarios` las insignias alcanzadas.
- **Respuesta:** 200 OK
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
- **Errores:** 400 Bad Request (respuestas inválidas o preguntas ajenas a la lección); 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `GET /mobile/medallas`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve el catálogo completo de insignias de la plataforma indicando cuáles han sido desbloqueadas por el colaborador autenticado y la fecha en que las obtuvo.
- **Respuesta:** 200 OK
  ```json
  {
    "puntosTotales": 40,
    "medallas": [
      {
        "id": 1,
        "nombre": "Novato Consciente",
        "descripcion": "Completa tu primera microlección de ciberseguridad.",
        "iconoUrl": "shield-alert",
        "puntosRequeridos": 10,
        "desbloqueada": true,
        "fechaObtencion": "2026-11-21T21:10:00.000Z"
      },
      {
        "id": 2,
        "nombre": "Guardián Digital",
        "descripcion": "Alcanza 30 puntos en entrenamientos defensivos.",
        "iconoUrl": "shield-check",
        "puntosRequeridos": 30,
        "desbloqueada": true,
        "fechaObtencion": "2026-11-21T21:20:00.000Z"
      },
      {
        "id": 3,
        "nombre": "Ojo Crítico",
        "descripcion": "Alcanza 60 puntos dominando la detección de fraudes.",
        "iconoUrl": "eye",
        "puntosRequeridos": 60,
        "desbloqueada": false,
        "fechaObtencion": null
      }
    ]
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /mobile/ranking`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve el ranking interno entre los colaboradores activos de la misma empresa (`empresaId`), ordenado por `puntosTotales` DESC, `rachaDiasSeguros` DESC, `scoreRiesgo` ASC y `nombre` ASC. Indica la posición de cada usuario y la posición exacta del colaborador autenticado (`miPosicion`).
- **Respuesta:** 200 OK
  ```json
  {
    "miPosicion": 2,
    "ranking": [
      {
        "posicion": 1,
        "usuarioId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "nombre": "Carlos Mendoza",
        "departamento": "TI",
        "puntosTotales": 70,
        "medallasCount": 3,
        "rachaDiasSeguros": 12,
        "scoreRiesgo": 0,
        "esUsuarioActual": false
      },
      {
        "posicion": 2,
        "usuarioId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "nombre": "Mariano Silva",
        "departamento": "Finanzas",
        "puntosTotales": 40,
        "medallasCount": 2,
        "rachaDiasSeguros": 5,
        "scoreRiesgo": 0,
        "esUsuarioActual": true
      }
    ]
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /departamentos`

- **Protección:** `JwtAuthGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Deriva el tenant de forma segura desde `request.user.empresaId`.
- **Respuesta:** 200 OK con estadísticas de departamentos de la empresa autenticada.
- **Errores:** 401 Unauthorized; 403 Forbidden (sin empresa asignada).

---

## Empleados

### `POST /empresas/:empresaId/empleados/import-csv`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `multipart/form-data` con campo `file` (archivo CSV delimitado por comas o punto y coma con encabezados: `nombre,correo,departamento,telefono(opcional)`).
- **Respuesta:** 201 Created con resumen de importación masiva.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/empleados`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Query Params:** `page` (INT, default 1), `limit` (INT, default 10), `search` (opcional), `departmentId` (INT opcional).
- **Ejemplo:** `/empresas/1/empleados?page=1&limit=10&search=Mariano&departmentId=1`
- **Respuesta:** 200 OK con listado paginado `{ data, total, page, limit }`.
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `POST /empresas/:empresaId/empleados`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `CreateEmployeeDto`

```json
{
  "name": "Mariano Silva",
  "email": "mariano.silva@techcorp.com",
  "departmentId": 1,
  "departmentName": "Finanzas",
  "phone": "+51987654321"
}
```

- **Respuesta:** 201 Created con empleado registrado (UUIDv4 generado).
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `PUT /empresas/:empresaId/empleados/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Payload:** `UpdateEmployeeDto`

```json
{
  "name": "Mariano Silva R.",
  "email": "mariano.silva@techcorp.com",
  "departmentId": 2,
  "phone": "+51999888777"
}
```

- **Respuesta:** 200 OK con empleado actualizado.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found (empleado no existe en la empresa).

### `DELETE /empresas/:empresaId/empleados/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Respuesta:** 200 OK confirmando eliminación.
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found (empleado no existe en la empresa).

### `GET /empresas/:empresaId/empleados/resumen`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Query Params:** `page` (INT, default 1), `limit` (INT, default 10), `search` (opcional), `departmentId` (INT opcional).
- **Respuesta:** 200 OK con resumen paginado `{ data: [{ id, nombre, correo, departamento, scoreRiesgo }], total, page, limit }`.
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /empleados/:id`

- **Protección:** `JwtAuthGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `id` (UUIDv4, `ParseUUIDPipe`).
- **Comportamiento:** Restringe la consulta estrictamente a `request.user.empresaId`.
- **Respuesta:** 200 OK con información del empleado.
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found.

---

## Plantillas

### `GET /empresas/:empresaId/plantillas`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Query Params:** `page` (INT, default 1), `limit` (INT, default 10), `search`, `attackType` (`PHISHING | SMISHING`), `difficulty` (`BAJO | MEDIO | ALTO`).
- **Respuesta:** 200 OK con plantillas globales (`empresa_id = null`) y personalizadas de la empresa, paginadas.
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `POST /empresas/:empresaId/plantillas`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `CreateTemplateDto`

```json
{
  "title": "Actualización Urgente de Credenciales Microsoft 365",
  "subject": "Acción Requerida: Se requiere verificar su cuenta institucional",
  "bodyHtml": "<p>Estimado {{nombre}}, detectamos un inicio de sesión inusual.</p>",
  "attackType": "PHISHING",
  "difficulty": "MEDIO",
  "landingTipo": "microsoft",
  "landingId": 2
}
```

- `landingTipo` es opcional (`'microsoft' | 'google' | 'corporativo' | 'bancario' | 'generico' | 'unjbg' | 'personalizado'`; default `'generico'`).
- `landingId` es opcional (INT, referencia a `portales_simulados.id`; valida que exista y sea portal global o pertenezca a la empresa).
- **Respuesta:** 201 Created con plantilla asociada a la empresa.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `PUT /empresas/:empresaId/plantillas/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (INT, `ParseIntPipe`).
- **Payload:** `UpdateTemplateDto` (campos opcionales: `title`, `subject`, `bodyHtml`, `attackType`, `difficulty`, `landingTipo`, `landingId`).
- **Regla Crítica de Blindaje:** Las plantillas globales (`empresa_id = null`) **no pueden ser modificadas** por ningún tenant (retorna 403 Forbidden). Las plantillas de otra empresa tampoco pueden ser modificadas (403 Forbidden). Si se envía `landingId`, valida que el portal exista y sea global o propio del tenant (400 Bad Request si no existe o no autorizado).
- **Respuesta:** 200 OK con plantilla actualizada.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden (plantilla global o ajena protegida); 404 Not Found.

### `DELETE /empresas/:empresaId/plantillas/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (INT, `ParseIntPipe`).
- **Regla Crítica de Blindaje:** Las plantillas globales (`empresa_id = null`) **no pueden ser eliminadas** por ningún tenant (retorna 403 Forbidden). Las plantillas de otra empresa tampoco pueden ser eliminadas (403 Forbidden).
- **Respuesta:** 200 OK con confirmación de eliminación.
- **Errores:** 401 Unauthorized; 403 Forbidden (plantilla global o ajena protegida); 404 Not Found.

---

## Portales Simulados (Fase 2.5)

Módulo multi-tenant para administrar el catálogo de portales simulados utilizados como páginas de aterrizaje en las campañas de simulación. Incluye 5 portales precargados del sistema (destacando **Aula Virtual UNJBG**) y la capacidad de crear portales corporativos personalizados.

### `GET /empresas/:empresaId/portales`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Comportamiento:** Retorna la lista consolidada de portales simulados globales del sistema (`empresa_id = null`) y los portales personalizados creados por la empresa (`empresa_id = :empresaId`).
- **Respuesta:** 200 OK
  ```json
  [
    {
      "id": 1,
      "empresaId": null,
      "nombre": "Aula Virtual UNJBG",
      "tipoBase": "unjbg",
      "tituloPortal": "Aula Virtual - UNJBG",
      "subtitulo": "Universidad Nacional Jorge Basadre Grohmann",
      "logoUrl": null,
      "colorPrimario": "#1d4ed8",
      "colorFondo": "#f1f5f9",
      "labelUsuario": "Nombre de usuario",
      "labelPassword": "Contraseña",
      "textoBoton": "Acceder",
      "esGlobal": true
    },
    {
      "id": 2,
      "empresaId": null,
      "nombre": "Microsoft 365 / Outlook",
      "tipoBase": "microsoft",
      "tituloPortal": "Iniciar sesión",
      "subtitulo": "Continuar en Microsoft 365",
      "logoUrl": null,
      "colorPrimario": "#0067b8",
      "colorFondo": "#f0f4f9",
      "labelUsuario": "Correo electrónico, teléfono o Skype",
      "labelPassword": "Contraseña",
      "textoBoton": "Iniciar sesión",
      "esGlobal": true
    }
  ]
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/portales/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (INT, `ParseIntPipe`).
- **Comportamiento:** Devuelve el portal si es global (`empresa_id = null`) o si pertenece a la empresa.
- **Respuesta:** 200 OK con el objeto `PortalEntity`.
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /empresas/:empresaId/portales`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `CreatePortalDto`
  ```json
  {
    "nombre": "Portal Intranet TechCorp",
    "tipoBase": "personalizado",
    "tituloPortal": "Acceso a Colaboradores TechCorp",
    "subtitulo": "Credenciales Únicas de Red",
    "logoUrl": "https://img.techcorp.com/logo.png",
    "colorPrimario": "#0284c7",
    "colorFondo": "#f8fafc",
    "labelUsuario": "Usuario de Red",
    "labelPassword": "Password de Acceso",
    "textoBoton": "Ingresar al Sistema"
  }
  ```
- **Respuesta:** 201 Created con el portal creado y vinculado a `empresa_id`.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `PUT /empresas/:empresaId/portales/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (INT, `ParseIntPipe`).
- **Payload:** `UpdatePortalDto` (campos opcionales).
- **Regla Crítica de Blindaje:** Los portales globales (`empresa_id = null`) **no pueden ser modificados** por ningún usuario o empresa (retorna **403 Forbidden**). Solo se pueden modificar portales propios.
- **Respuesta:** 200 OK con el portal actualizado.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden (portal global o ajeno); 404 Not Found.

### `DELETE /empresas/:empresaId/portales/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (INT, `ParseIntPipe`).
- **Regla Crítica de Blindaje:** Los portales globales (`empresa_id = null`) **no pueden ser eliminados** (retorna **403 Forbidden**).
- **Respuesta:** 200 OK con confirmación de eliminación.
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found.

---

## Campañas (Motor Completo - Fase 1)

Todas las rutas del módulo de campañas están protegidas mediante `JwtAuthGuard` y `CompanyTenantGuard`, asegurando aislamiento estricto por `empresa_id`.

### `GET /empresas/:empresaId/campanas/resumen`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Comportamiento:** Devuelve los conteos agregados por estado de las campañas de la empresa. Declarada **antes** de `:id` para evitar colisiones de rutas en NestJS.
- **Respuesta:** 200 OK
  ```json
  {
    "total": 12,
    "programadas": 4,
    "enCurso": 2,
    "finalizadas": 5,
    "canceladas": 1
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/campanas`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Query Params:** `page` (INT, default 1), `limit` (INT, default 10), `search` (string opcional), `status` (`programada | en_curso | finalizada | cancelada`), `attackType` (string opcional, case-insensitive).
- **Respuesta:** 200 OK con listado paginado:
  ```json
  {
    "data": [
      {
        "id": "7b520fa5-df93-4560-96f0-1c39050d248b",
        "templateId": 1,
        "name": "Campaña de concientización Q4",
        "scheduledDate": "2026-11-01T09:00:00.000Z",
        "shippingMethod": "masivo",
        "status": "programada",
        "createdAt": "2026-10-25T14:30:00.000Z",
        "targetUserIds": ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
        "template": {
          "id": 1,
          "titulo": "Actualización Urgente de Credenciales Microsoft 365",
          "metodoAtaque": "phishing"
        },
        "totalParticipants": 25
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/campanas/:id/participantes`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Query Params:** `page` (INT, default 1), `limit` (INT, default 10), `search` (nombre o correo), `departmentId` (INT opcional).
- **Respuesta:** 200 OK con colaboradores paginados (excluye `token_rastreo` y `password_hash`):
  ```json
  {
    "data": [
      {
        "usuarioId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "nombre": "Mariano Silva",
        "correo": "mariano.silva@techcorp.com",
        "departamento": "Finanzas",
        "estado": "activo"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found (campaña no existe o no pertenece a la empresa).

### `GET /empresas/:empresaId/campanas/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Respuesta:** 200 OK con detalle completo de campaña y plantilla asociada:
  ```json
  {
    "id": "7b520fa5-df93-4560-96f0-1c39050d248b",
    "templateId": 1,
    "name": "Campaña de concientización Q4",
    "scheduledDate": "2026-11-01T09:00:00.000Z",
    "shippingMethod": "masivo",
    "status": "programada",
    "createdAt": "2026-10-25T14:30:00.000Z",
    "template": {
      "id": 1,
      "titulo": "Actualización Urgente de Credenciales Microsoft 365",
      "metodoAtaque": "phishing",
      "asunto": "Acción Requerida: Verificar su cuenta institucional",
      "cuerpoHtml": "<p>Estimado {{nombre}}...</p>",
      "indicadorDificultad": "media"
    },
    "totalParticipants": 25
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /empresas/:empresaId/campanas`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `empresaId` (INT, `ParseIntPipe`).
- **Payload:** `CreateCampaignDto`
  ```json
  {
    "name": "Campaña de concientización Q4 - Tacna",
    "templateId": 1,
    "scheduledDate": "2026-11-01T09:00:00.000Z",
    "shippingMethod": "masivo",
    "targetUserIds": ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
    "departmentIds": [1, 2]
  }
  ```
- **Reglas:** Debe incluir al menos `targetUserIds` o `departmentIds`. Deduplica colaboradores y verifica pertenencia de todos al tenant. La plantilla debe pertenecer a la empresa o ser global (`empresa_id = null`). Inserta atómicamente la campaña y registros en `campana_usuarios` con `token_rastreo` UUIDv4.
- **Respuesta:** 201 Created con campaña programada.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `POST /empresas/:empresaId/campanas/:id/participantes`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Payload:** `ManageParticipantsDto`
  ```json
  {
    "targetUserIds": ["b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"],
    "departmentIds": [3]
  }
  ```
- **Reglas:** Solo permitido si la campaña está en estado `'programada'`. Ignora colaboradores que ya estén inscritos y agrega los nuevos con `token_rastreo` UUIDv4.
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Se agregaron 5 nuevos participantes a la campaña.",
    "added": 5
  }
  ```
- **Errores:** 400 Bad Request (estado no programado o sin objetivos válidos); 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `DELETE /empresas/:empresaId/campanas/:id/participantes/:usuarioId`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`), `usuarioId` (UUIDv4, `ParseUUIDPipe`).
- **Reglas:** Solo permitido en estado `'programada'`. Valida primero que el usuario esté inscrito (`404` si no); luego valida que la campaña conserve al menos 1 participante (`400` si se intenta borrar al último).
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Colaborador retirado exitosamente de la campaña.",
    "usuarioId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /empresas/:empresaId/campanas/:id/duplicar`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Payload:** `DuplicateCampaignDto`
  ```json
  {
    "name": "Campaña Clonada Q4",
    "scheduledDate": "2026-12-01T09:00:00.000Z"
  }
  ```
- **Reglas:** Clona la plantilla, modalidad de envío y colaboradores de la campaña origen, generando una nueva campaña en estado `'programada'` con nuevos tokens de rastreo UUIDv4.
- **Respuesta:** 201 Created con la nueva campaña clonada.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `PATCH /empresas/:empresaId/campanas/:id/cancelar`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Reglas:** Solo permitido si la campaña se encuentra en estado `'programada'` o `'en_curso'`. Rechaza si ya está `'finalizada'` o `'cancelada'`.
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Campaña cancelada exitosamente.",
    "campaignId": "7b520fa5-df93-4560-96f0-1c39050d248b"
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `PATCH /empresas/:empresaId/campanas/:id/finalizar`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Reglas:** Solo permitido si la campaña se encuentra en estado `'en_curso'`. Si está en otro estado (`'programada'`, `'finalizada'`, `'cancelada'`), rechaza con `400 Bad Request`. Si no existe o pertenece a otra empresa, responde `404 Not Found`. Actualiza el estado a `'finalizada'`.
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Campaña finalizada exitosamente.",
    "campaignId": "7b520fa5-df93-4560-96f0-1c39050d248b"
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `PATCH /empresas/:empresaId/campanas/:id/finalizar`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Reglas:** Solo permitido si la campaña se encuentra en estado `'en_curso'`. Si está en otro estado (`'programada'`, `'finalizada'`, `'cancelada'`), rechaza con `400 Bad Request`. Si no existe o pertenece a otra empresa, responde `404 Not Found`. Actualiza el estado a `'finalizada'`.
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Campaña finalizada exitosamente.",
    "campaignId": "7b520fa5-df93-4560-96f0-1c39050d248b"
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `PATCH /empresas/:empresaId/campanas/:id`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Payload:** `UpdateCampaignDto` (campos opcionales: `name`, `templateId`, `scheduledDate`, `shippingMethod`).
- **Reglas:** Solo permitido si la campaña está en estado `'programada'`. Si se actualiza `templateId`, se valida pertenencia al tenant o que sea global.
- **Respuesta:** 200 OK con metadatos de campaña actualizados.
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /empresas/:empresaId/campanas/:id/despachar`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de ruta:** `empresaId` (INT, `ParseIntPipe`), `id` (UUIDv4, `ParseUUIDPipe`).
- **Reglas:**
  - Bloqueo atómico y concurrente de la campaña: valida que pertenezca a la empresa y transiciona su estado de `'programada'` a `'en_curso'`. Si no está programada o no pertenece a la empresa, rechaza con `404 Not Found`.
  - Si la campaña no tiene participantes inscritos, rechaza con `400 Bad Request`.
  - Interpola las variables dinámicas (`{{nombre}}`, `{{correo}}`, `{{empresa}}`, `{{enlace_simulacion}}`, `{{pixel_rastreo}}`).
  - Envía vía `Resend` (email) o `Twilio` (SMS) en modo `live`, o simula y loguea en modo `sandbox`.
  - Respeta la modalidad: `masivo` (despacho inmediato en ráfaga) o `escalonado` (intervalos de 500 ms).
  - Registra eventos `'enviado'` en lote en la tabla `eventos_simulacion`.
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Campaña despachada exitosamente.",
    "campaignId": "7b520fa5-df93-4560-96f0-1c39050d248b",
    "totalTargets": 12,
    "mode": "sandbox"
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden; 404 Not Found.

---

## Rastreo y Simulaciones Públicas (Fase 2 - Zero-Credential)

Endpoints públicos para tracking de campañas y recolección de eventos de simulación.

### `GET /track/open/:token`

- **Protección:** Pública (sin JWT).
- **Parámetro de ruta:** `token` (UUIDv4, `ParseUUIDPipe`).
- **Comportamiento:**
  - Registra de forma idempotente el evento `'abierto'` en `eventos_simulacion` si no existe previamente y la campaña no se encuentra en estado `'cancelada'` ni `'finalizada'`.
  - Almacena metadatos seguros de auditoría: IP anonimizada (`ip_anonimizada`) y cabecera User-Agent (`user_agent`).
  - Retorna un pixel GIF 1x1 transparente binario (43 bytes).
  - Incluye cabeceras anti-caché: `Cache-Control: no-cache, no-store, must-revalidate`, `Pragma: no-cache`, `Expires: 0`.
- **Respuesta:** 200 OK con `Content-Type: image/gif`.

### `GET /track/click/:token`

- **Protección:** Pública (sin JWT).
- **Parámetro de ruta:** `token` (UUIDv4, `ParseUUIDPipe`).
- **Comportamiento:**
  - Registra de forma idempotente el evento `'click'` en `eventos_simulacion` si no existe previamente.
  - Incrementa el `score_riesgo` del colaborador en `+15` puntos (acotado estrictamente a `100` máximo) y reinicia su `racha_dias_seguros = 0`.
  - Redirige mediante HTTP 302 Found a `${FRONTEND_URL}/sim/verificar?t=${token}` (o fallback `${FRONTEND_URL}/login` si el token es inválido o la campaña está cancelada o finalizada).
- **Respuesta:** 302 Found (Redirección).

### `GET /track/context/:token`

- **Protección:** Pública (sin JWT).
- **Parámetro de ruta:** `token` (UUIDv4, `ParseUUIDPipe`).
- **Comportamiento:**
  - Retorna información contextual **no sensible** requerida por la landing page de simulación para renderizar la interfaz adecuada.
  - Infiere dinámicamente `landingTipo` si la plantilla estaba marcada como `'generico'` o utiliza el tipo base del portal.
  - Retorna `portalConfig` con la personalización visual (global o corporativa) del portal asignado a la plantilla (o fallback al portal global correspondiente).
- **Respuesta:** 200 OK
  ```json
  {
    "token": "7b520fa5-df93-4560-96f0-1c39050d248b",
    "landingTipo": "unjbg",
    "metodoAtaque": "phishing",
    "nombreEmpresa": "TechCorp Perú S.A.C.",
    "tituloPlantilla": "Acceso Requerido al Aula Virtual UNJBG",
    "asunto": "Acción Requerida: Verifique su cuenta institucional",
    "indicadorDificultad": "media",
    "portalConfig": {
      "id": 1,
      "nombre": "Aula Virtual UNJBG",
      "tipoBase": "unjbg",
      "tituloPortal": "Aula Virtual - UNJBG",
      "subtitulo": "Universidad Nacional Jorge Basadre Grohmann",
      "logoUrl": null,
      "colorPrimario": "#1d4ed8",
      "colorFondo": "#f1f5f9",
      "labelUsuario": "Nombre de usuario",
      "labelPassword": "Contraseña",
      "textoBoton": "Acceder"
    }
  }
  ```
- **Errores:** 400 Bad Request (token malformado); 404 Not Found (token inexistente o campaña cancelada o finalizada).

### `POST /track/submit`

- **Protección:** Pública (sin JWT).
- **Políticas Críticas de Seguridad (Zero-Credential Storage):**
  - El DTO y el pipeline (`forbidNonWhitelisted: true`) **PROHÍBEN ESTRICTAMENTE** recibir contraseñas, PINs, correos o datos ingresados en el formulario de la landing simulada. Cualquier campo adicional provoca un inmediato rechazo `400 Bad Request`.
  - Jamás se loguea ni persiste información sensible ingresada por el colaborador.
- **Payload:** `TrackSubmitDto`
  ```json
  {
    "token": "7b520fa5-df93-4560-96f0-1c39050d248b"
  }
  ```
- **Comportamiento:**
  - Registra de forma idempotente el evento `'formulario_enviado'` en `eventos_simulacion` con IP anonimizada y User-Agent.
  - Incrementa el `score_riesgo` del colaborador en `+30` puntos (acotado estrictamente a `100` máximo) y reinicia su `racha_dias_seguros = 0`.
  - Dispara el puerto `SIMULATION_ALERT_HOOK_PORT` para alertar internamente del incidente de seguridad.
  - Retorna feedback educativo inmediato con consejos de concienciación.
- **Respuesta:** 200 OK
  ```json
  {
    "status": "compromised",
    "message": "Simulación detectada: Has ingresado credenciales en una prueba de concientización de seguridad de tu organización.",
    "landingTipo": "microsoft",
    "recomendaciones": [
      "Verifica siempre la URL y el certificado SSL del sitio antes de ingresar tus contraseñas.",
      "Nunca proporciones tus credenciales corporativas en enlaces recibidos por correos o SMS imprevistos.",
      "Comunícate inmediatamente con el área de TI o Ciberseguridad de tu organización ante cualquier sospecha."
    ]
  }
  ```
- **Errores:** 400 Bad Request (payload con campos extraños o token inválido); 404 Not Found (simulación inexistente, cancelada o finalizada).

---

## Móvil (Fase 3 - M3)

Endpoints diseñados para la aplicación móvil Flutter utilizada por los colaboradores finales de las organizaciones clientes.

### `POST /mobile/auth/vincular`

- **Protección:** Pública (sin JWT).
- **Comportamiento:** Valida las credenciales corporativas (`correoCorporativo` y `codigoAcceso` de la empresa) y emite un token JWT con `role: 'EMPLOYEE'` y vigencia de 30 días para la sesión del dispositivo móvil.
- **Payload:** `VincularMobileDto`
  ```json
  {
    "correoCorporativo": "mariano.silva@techcorp.com",
    "codigoAcceso": "PW9X2A81"
  }
  ```
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Dispositivo móvil vinculado exitosamente.",
    "accessToken": "eyJhbGciOi...",
    "usuario": {
      "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "nombre": "Mariano Silva",
      "correoCorporativo": "mariano.silva@techcorp.com",
      "numeroTelefonico": "+51987654321",
      "scoreRiesgo": 0,
      "rachaDiasSeguros": 0,
      "pushHabilitado": false,
      "departamento": "Finanzas",
      "empresa": {
        "id": 1,
        "nombre": "TechCorp Perú S.A.C."
      }
    }
  }
  ```
- **Errores:** 400 Bad Request (datos inválidos); 401 Unauthorized (código de acceso inválido o correo no registrado/inactivo).

### `GET /mobile/perfil`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve el perfil completo del colaborador móvil autenticado, su score de riesgo, racha de días seguros, estado del token push FCM y métricas agregadas de capacitación y ranking (Fase 4).
- **Respuesta:** 200 OK
  ```json
  {
    "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "nombre": "Mariano Silva",
    "correoCorporativo": "mariano.silva@techcorp.com",
    "numeroTelefonico": "+51987654321",
    "scoreRiesgo": 0,
    "rachaDiasSeguros": 5,
    "pushHabilitado": true,
    "departamento": "Finanzas",
    "empresa": {
      "id": 1,
      "nombre": "TechCorp Perú S.A.C."
    },
    "puntosTotales": 40,
    "leccionesCompletadas": 3,
    "leccionesPendientes": 1,
    "medallasObtenidas": 2,
    "posicionRanking": 2
  }
  ```
- **Errores:** 401 Unauthorized (token ausente o expirado); 403 Forbidden (no posee rol EMPLOYEE); 404 Not Found.

### `PUT /mobile/push-token`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Registra o actualiza el FCM registration token en el perfil del colaborador para habilitar el envío de alertas push ante simulaciones de ciberataques.
- **Payload:** `UpdatePushTokenDto`
  ```json
  {
    "token": "dK8j9...fcm_registration_token_string"
  }
  ```
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Token de notificación push registrado exitosamente.",
    "pushHabilitado": true
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `DELETE /mobile/push-token`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Limpia `token_notificacion_push = null` en la base de datos al cerrar sesión o desvincular el dispositivo móvil.
- **Respuesta:** 200 OK
  ```json
  {
    "message": "Token de notificación push desvinculado exitosamente.",
    "pushHabilitado": false
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `POST /mobile/reportes`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Permite reportar un mensaje sospechoso real recibido por el colaborador. Reduce el `score_riesgo` en `-5` puntos (con piso mínimo garantizado en `0`) e incrementa `racha_dias_seguros` en `+1`.
- **Payload:** `CreateMobileReportDto`
  ```json
  {
    "canal": "email",
    "remitente": "banco-seguridad@notificaciones-alerta.com",
    "asunto": "Urgente: Bloqueo de cuenta bancaria",
    "descripcion": "Recibí un correo sospechoso pidiéndome validar mis claves corporativas.",
    "urlSospechosa": "https://banco-seguro-login.com"
  }
  ```
- **Respuesta:** 201 Created
  ```json
  {
    "message": "Reporte registrado exitosamente. Tu score de riesgo ha disminuido.",
    "reporteId": "c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
    "scoreRiesgo": 0,
    "rachaDiasSeguros": 6,
    "puntosDisminuidos": 5
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

---

## Capacitación y Gamificación Móvil (Fase 4)

### `GET /mobile/lecciones`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve todas las microlecciones educativas de la plataforma clasificadas según el estado de progreso del colaborador autenticado (`asignadasPendientes`, `catalogoDisponible` y `completadas`).
- **Respuesta:** 200 OK
  ```json
  {
    "asignadasPendientes": [
      {
        "id": 1,
        "titulo": "Identificación de Phishing por Correo Electrónico",
        "metodoAtaque": "phishing",
        "contenidoMultimedia": "https://images.unsplash.com/photo-1563986768609-322da13575f3",
        "duracionMinutos": 2,
        "puntosRecompensa": 10,
        "estado": "pendiente"
      }
    ],
    "catalogoDisponible": [
      {
        "id": 5,
        "titulo": "Fundamentos de Ciberseguridad y Enlaces Maliciosos",
        "metodoAtaque": "general",
        "contenidoMultimedia": "https://images.unsplash.com/photo-1614064641938-3bbee52942c7",
        "duracionMinutos": 2,
        "puntosRecompensa": 10,
        "estado": "disponible"
      }
    ],
    "completadas": [
      {
        "id": 2,
        "titulo": "Protección contra Smishing y Mensajería SMS Fraudulenta",
        "metodoAtaque": "smishing",
        "contenidoMultimedia": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5",
        "duracionMinutos": 2,
        "puntosRecompensa": 10,
        "estado": "completada",
        "puntosObtenidos": 10,
        "fechaCompletado": "2026-11-21T21:00:00.000Z"
      }
    ]
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /mobile/lecciones/:id`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `id` (INT, `ParseIntPipe`).
- **Comportamiento:** Devuelve el contenido de la microlección, su estado actual para el usuario (`estadoUsuario`) y sus preguntas de evaluación. **Omite estrictamente `respuesta_correcta`**.
- **Respuesta:** 200 OK
  ```json
  {
    "id": 1,
    "titulo": "Identificación de Phishing por Correo Electrónico",
    "metodoAtaque": "phishing",
    "contenidoMultimedia": "https://images.unsplash.com/photo-1563986768609-322da13575f3",
    "duracionMinutos": 2,
    "puntosRecompensa": 10,
    "estadoUsuario": "pendiente",
    "preguntas": [
      {
        "id": 1,
        "enunciado": "¿Cuál es la señal más clara de que un correo entrante puede ser un intento de phishing?",
        "opcionA": "Urgencia extrema exigiendo ingresar credenciales y discrepancia en el dominio del remitente",
        "opcionB": "El correo fue enviado durante el horario habitual de oficina",
        "opcionC": "El remitente incluye el logotipo oficial de la empresa en la cabecera",
        "opcionD": "El correo no contiene ningún archivo adjunto ni hipervínculo"
      }
    ]
  }
  ```
- **Errores:** 400 Bad Request (parámetro id inválido); 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `POST /mobile/lecciones/:id/evaluar`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetro de ruta:** `id` (INT, `ParseIntPipe`).
- **Payload:** `EvaluateLessonDto`
  ```json
  {
    "respuestas": [
      {
        "preguntaId": 1,
        "respuestaSeleccionada": "A"
      },
      {
        "preguntaId": 2,
        "respuestaSeleccionada": "B"
      },
      {
        "preguntaId": 3,
        "respuestaSeleccionada": "B"
      }
    ]
  }
  ```
- **Comportamiento:** Califica las respuestas en el servidor (umbral >= 70%). Si aprueba por primera vez, reduce -10 puntos de `score_riesgo` (piso mínimo en 0), suma los puntos de recompensa y desbloquea automáticamente en `medallas_usuarios` las insignias alcanzadas.
- **Respuesta:** 200 OK
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
- **Errores:** 400 Bad Request (respuestas inválidas o preguntas ajenas a la lección); 401 Unauthorized; 403 Forbidden; 404 Not Found.

### `GET /mobile/medallas`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve el catálogo completo de insignias de la plataforma indicando cuáles han sido desbloqueadas por el colaborador autenticado y la fecha en que las obtuvo.
- **Respuesta:** 200 OK
  ```json
  {
    "puntosTotales": 40,
    "medallas": [
      {
        "id": 1,
        "nombre": "Novato Consciente",
        "descripcion": "Completa tu primera microlección de ciberseguridad.",
        "iconoUrl": "shield-alert",
        "puntosRequeridos": 10,
        "desbloqueada": true,
        "fechaObtencion": "2026-11-21T21:10:00.000Z"
      },
      {
        "id": 2,
        "nombre": "Guardián Digital",
        "descripcion": "Alcanza 30 puntos en entrenamientos defensivos.",
        "iconoUrl": "shield-check",
        "puntosRequeridos": 30,
        "desbloqueada": true,
        "fechaObtencion": "2026-11-21T21:20:00.000Z"
      },
      {
        "id": 3,
        "nombre": "Ojo Crítico",
        "descripcion": "Alcanza 60 puntos dominando la detección de fraudes.",
        "iconoUrl": "eye",
        "puntosRequeridos": 60,
        "desbloqueada": false,
        "fechaObtencion": null
      }
    ]
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.

### `GET /mobile/ranking`

- **Protección:** `EmployeeJwtGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Comportamiento:** Devuelve el ranking interno entre los colaboradores activos de la misma empresa (`empresaId`), ordenado por `puntosTotales` DESC, `rachaDiasSeguros` DESC, `scoreRiesgo` ASC y `nombre` ASC. Indica la posición de cada usuario y la posición exacta del colaborador autenticado (`miPosicion`).
- **Respuesta:** 200 OK
  ```json
  {
    "miPosicion": 2,
    "ranking": [
      {
        "posicion": 1,
        "usuarioId": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
        "nombre": "Carlos Mendoza",
        "departamento": "TI",
        "puntosTotales": 70,
        "medallasCount": 3,
        "rachaDiasSeguros": 12,
        "scoreRiesgo": 0,
        "esUsuarioActual": false
      },
      {
        "posicion": 2,
        "usuarioId": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        "nombre": "Mariano Silva",
        "departamento": "Finanzas",
        "puntosTotales": 40,
        "medallasCount": 2,
        "rachaDiasSeguros": 5,
        "scoreRiesgo": 0,
        "esUsuarioActual": true
      }
    ]
  }
  ```
- **Errores:** 401 Unauthorized; 403 Forbidden.


---

## Analítica Ejecutiva y Reportes (Fase 5 M5)

Endpoints administrativos para visualización de postura global de riesgo, rendimiento de campañas, adopción móvil, susceptibilidad por departamentos y vectores de ataque, evolución mensual y exportación de reportes ejecutivos en CSV.

Todos los endpoints están protegidos por `JwtAuthGuard` y `CompanyTenantGuard`, restringiendo el acceso exclusivamente a administradores web autenticados de la organización correspondiente a `:empresaId`.

### `GET /empresas/:empresaId/analytics/resumen`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de Ruta:**
  - `empresaId` (int, obligatorio): ID numérico de la empresa.
- **Parámetros de Consulta (Opcionales):**
  - `desde` (string, opcional): Fecha de inicio del filtro (`YYYY-MM-DD`).
  - `hasta` (string, opcional): Fecha de fin del filtro (`YYYY-MM-DD`).
- **Respuesta:** 200 OK
  ```json
  {
    "posturaRiesgo": {
      "scoreRiesgoPromedio": 18.5,
      "nivelRiesgoGlobal": "bajo",
      "distribucion": {
        "bajo": 42,
        "medio": 8,
        "critico": 2
      }
    },
    "adopcionMovil": {
      "totalColaboradores": 52,
      "colaboradoresVinculados": 45,
      "tasaAdopcion": 86.5
    },
    "metricasSimulaciones": {
      "totalCampanas": 6,
      "totalEnvios": 280,
      "totalAperturas": 210,
      "totalClics": 35,
      "totalEnviosCredenciales": 12,
      "totalReportes": 68,
      "tasaApertura": 75.0,
      "tasaClic": 12.5,
      "tasaCompromisoCredenciales": 4.3,
      "tasaReporteTemprano": 24.3
    },
    "metricasCapacitacion": {
      "totalLeccionesCompletadas": 145,
      "totalLeccionesPendientes": 22,
      "totalLeccionesReprobadas": 15,
      "tasaAprobacion": 90.6
    }
  }
  ```
- **Errores:** 400 Bad Request (fechas inválidas o `desde > hasta`); 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/analytics/departamentos`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de Ruta:**
  - `empresaId` (int, obligatorio): ID numérico de la empresa.
- **Parámetros de Consulta (Opcionales):**
  - `desde` (string, opcional): `YYYY-MM-DD`.
  - `hasta` (string, opcional): `YYYY-MM-DD`.
- **Comportamiento:** Devuelve el desglose comparativo de riesgo agrupado por área, consolidando colaboradores sin área como `"Sin departamento"` y ordenado por `scoreRiesgoPromedio DESC`, `totalColaboradores DESC` y `departamento ASC`.
- **Respuesta:** 200 OK
  ```json
  [
    {
      "departamentoId": 2,
      "departamento": "Finanzas",
      "totalColaboradores": 12,
      "scoreRiesgoPromedio": 38.5,
      "nivelRiesgo": "medio",
      "simulacionesRecibidas": 48,
      "clicsEnSimulacion": 9,
      "credencialesComprometidas": 3,
      "tasaVulnerabilidad": 25.0,
      "reportesRealizados": 6,
      "leccionesCompletadas": 18
    },
    {
      "departamentoId": 1,
      "departamento": "Tecnología",
      "totalColaboradores": 20,
      "scoreRiesgoPromedio": 10.2,
      "nivelRiesgo": "bajo",
      "simulacionesRecibidas": 100,
      "clicsEnSimulacion": 4,
      "credencialesComprometidas": 1,
      "tasaVulnerabilidad": 5.0,
      "reportesRealizados": 35,
      "leccionesCompletadas": 55
    }
  ]
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/analytics/vectores`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de Ruta:**
  - `empresaId` (int, obligatorio): ID numérico de la empresa.
- **Parámetros de Consulta (Opcionales):**
  - `desde` (string, opcional): `YYYY-MM-DD`.
  - `hasta` (string, opcional): `YYYY-MM-DD`.
- **Comportamiento:** Retorna la efectividad y susceptibilidad ante los 4 vectores predefinidos (`phishing`, `smishing`, `vishing`, `ingenieria_social`).
- **Respuesta:** 200 OK
  ```json
  [
    {
      "metodoAtaque": "phishing",
      "totalEnvios": 150,
      "totalClics": 22,
      "totalEnviosCredenciales": 8,
      "tasaClic": 14.7,
      "tasaCompromiso": 5.3
    },
    {
      "metodoAtaque": "smishing",
      "totalEnvios": 60,
      "totalClics": 8,
      "totalEnviosCredenciales": 3,
      "tasaClic": 13.3,
      "tasaCompromiso": 5.0
    },
    {
      "metodoAtaque": "vishing",
      "totalEnvios": 40,
      "totalClics": 3,
      "totalEnviosCredenciales": 1,
      "tasaClic": 7.5,
      "tasaCompromiso": 2.5
    },
    {
      "metodoAtaque": "ingenieria_social",
      "totalEnvios": 30,
      "totalClics": 2,
      "totalEnviosCredenciales": 0,
      "tasaClic": 6.7,
      "tasaCompromiso": 0.0
    }
  ]
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/analytics/evolucion`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de Ruta:**
  - `empresaId` (int, obligatorio): ID numérico de la empresa.
- **Parámetros de Consulta (Opcionales):**
  - `desde` (string, opcional): `YYYY-MM-DD`.
  - `hasta` (string, opcional): `YYYY-MM-DD`.
- **Comportamiento:** Retorna la serie temporal mensual (últimos 6 meses por defecto o rango especificado) de actividad simulada, incidentes y capacitación.
- **Respuesta:** 200 OK
  ```json
  [
    {
      "periodo": "2026-06",
      "simulacionesEnviadas": 45,
      "incidentesSimulacion": 12,
      "reportesSospechosos": 5,
      "leccionesCompletadas": 18
    },
    {
      "periodo": "2026-07",
      "simulacionesEnviadas": 50,
      "incidentesSimulacion": 9,
      "reportesSospechosos": 8,
      "leccionesCompletadas": 24
    }
  ]
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/analytics/usuarios-destacados`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de Ruta:**
  - `empresaId` (int, obligatorio): ID numérico de la empresa.
- **Parámetros de Consulta (Opcionales):**
  - `desde` (string, opcional): `YYYY-MM-DD`.
  - `hasta` (string, opcional): `YYYY-MM-DD`.
- **Comportamiento:** Retorna dos listas acotadas (Top 5) de colaboradores activos: `mayorRiesgo` (ordenado por score de riesgo DESC, fallos DESC y nombre ASC para intervención prioritaria) y `mejoresDefensores` (ordenado por puntos acumulados DESC, reportes DESC, score de riesgo ASC y nombre ASC).
- **Respuesta:** 200 OK
  ```json
  {
    "mayorRiesgo": [
      {
        "id": "e4b1c2a0-1234-4567-89ab-cdef01234567",
        "nombre": "Juan Pérez",
        "correo": "juan.perez@empresa.com",
        "departamento": "Finanzas",
        "scoreRiesgo": 85,
        "nivelRiesgo": "critico",
        "simulacionesFallidas": 4
      }
    ],
    "mejoresDefensores": [
      {
        "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
        "nombre": "Ana Gómez",
        "correo": "ana.gomez@empresa.com",
        "departamento": "Tecnología",
        "puntosCapacitacion": 120,
        "reportesRealizados": 9,
        "scoreRiesgo": 0,
        "rachaDiasSeguros": 45
      }
    ]
  }
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.

### `GET /empresas/:empresaId/analytics/exportar`

- **Protección:** `JwtAuthGuard`, `CompanyTenantGuard`.
- **Header:** `Authorization: Bearer <JWT>`
- **Parámetros de Ruta:**
  - `empresaId` (int, obligatorio): ID numérico de la empresa.
- **Parámetros de Consulta (Opcionales):**
  - `desde` (string, opcional): `YYYY-MM-DD`.
  - `hasta` (string, opcional): `YYYY-MM-DD`.
- **Cabeceras de Respuesta:**
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="reporte-phishwarden-empresa-{empresaId}.csv"`
- **Comportamiento y Seguridad:**
  - Genera el reporte consolidado por colaborador activo en formato CSV estándar RFC 4180.
  - Incluye el prefijo Byte Order Mark UTF-8 (`\uFEFF`) para compatibilidad nativa con caracteres especiales y tildes en Microsoft Excel.
  - Aplica protección contra Inyección de Fórmulas (CSV Injection): antepone un apóstrofe (`'`) a cualquier celda de texto que comience con `=`, `+`, `-`, `@`, `\t` o `\r`.
- **Respuesta:** 200 OK (Descarga de archivo CSV)
  ```csv
  "ID Colaborador","Nombre","Correo Electrónico","Departamento","Score de Riesgo","Nivel de Riesgo","Simulaciones Recibidas","Clics en Enlace","Credenciales Comprometidas","Reportes Sospechosos","Lecciones Completadas","Puntos Acumulados","Estado App Móvil"
  "e4b1c2a0-1234-4567-89ab-cdef01234567","Juan Pérez","juan.perez@empresa.com","Finanzas",85,"critico",4,3,1,0,1,10,"Vinculado"
  "a1b2c3d4-5678-90ab-cdef-1234567890ab","Ana Gómez","ana.gomez@empresa.com","Tecnología",0,"bajo",6,0,0,9,5,120,"Vinculado"
  ```
- **Errores:** 400 Bad Request; 401 Unauthorized; 403 Forbidden.
