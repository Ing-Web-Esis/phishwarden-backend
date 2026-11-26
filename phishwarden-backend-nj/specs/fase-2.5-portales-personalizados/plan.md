# Plan de Implementación: Fase 2.5 Backend - Portales Simulados Globales y Personalizados

**Objetivo:** Desarrollar el catálogo multi-tenant de portales simulados (`portales_simulados`), precargar los 5 portales globales del sistema (destacando **Aula Virtual UNJBG**), incorporar la relación `landing_id` en `plantillas`, implementar el módulo hexagonal completo `src/portales/`, y enriquecer `GET /track/context/:token` con la configuración visual segura (`portalConfig`).

---

## 1. Evolución de Base de Datos y Modelo Prisma

### 1.1. Tabla `portales_simulados`
```sql
CREATE TABLE IF NOT EXISTS portales_simulados (
    id SERIAL PRIMARY KEY,
    empresa_id INT REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    tipo_base VARCHAR(30) NOT NULL DEFAULT 'personalizado' CHECK (tipo_base IN ('unjbg', 'microsoft', 'google', 'bancario', 'corporativo', 'personalizado')),
    titulo_portal VARCHAR(150) NOT NULL,
    subtitulo VARCHAR(255),
    logo_url TEXT,
    color_primario VARCHAR(20) NOT NULL DEFAULT '#0067b8',
    color_fondo VARCHAR(20) NOT NULL DEFAULT '#f3f4f6',
    label_usuario VARCHAR(80) NOT NULL DEFAULT 'Correo electrónico o usuario',
    label_password VARCHAR(80) NOT NULL DEFAULT 'Contraseña',
    texto_boton VARCHAR(60) NOT NULL DEFAULT 'Iniciar sesión',
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2. Portales Globales Precargados (`empresa_id = NULL`)
1. **Aula Virtual UNJBG:**
   - `tipo_base: 'unjbg'`
   - `nombre: 'Aula Virtual UNJBG'`
   - `titulo_portal: 'Aula Virtual - UNJBG'`
   - `subtitulo: 'Universidad Nacional Jorge Basadre Grohmann'`
   - `color_primario: '#1d4ed8'`
   - `color_fondo: '#f1f5f9'`
   - `label_usuario: 'Nombre de usuario'`
   - `label_password: 'Contraseña'`
   - `texto_boton: 'Acceder'`
2. **Microsoft 365 / Outlook:**
   - `tipo_base: 'microsoft'`
   - `nombre: 'Microsoft 365 / Outlook'`
   - `titulo_portal: 'Iniciar sesión'`
   - `subtitulo: 'Continuar en Microsoft 365'`
   - `color_primario: '#0067b8'`
   - `color_fondo: '#f0f4f9'`
   - `label_usuario: 'Correo electrónico, teléfono o Skype'`
   - `label_password: 'Contraseña'`
   - `texto_boton: 'Iniciar sesión'`
3. **Google Workspace:**
   - `tipo_base: 'google'`
   - `nombre: 'Google Workspace'`
   - `titulo_portal: 'Iniciar sesión'`
   - `subtitulo: 'Utiliza tu cuenta de Google'`
   - `color_primario: '#1a73e8'`
   - `color_fondo: '#f0f4f9'`
   - `label_usuario: 'Correo electrónico o teléfono'`
   - `label_password: 'Introduce tu contraseña'`
   - `texto_boton: 'Siguiente'`
4. **Validación Bancaria:**
   - `tipo_base: 'bancario'`
   - `nombre: 'Validación Bancaria'`
   - `titulo_portal: 'Portal de Seguridad Bancaria'`
   - `subtitulo: 'Validación de Canales Digitales y Transferencias'`
   - `color_primario: '#002f6c'`
   - `color_fondo: '#f1f5f9'`
   - `label_usuario: 'Número de Documento o Tarjeta'`
   - `label_password: 'Clave de Internet o Token Digital'`
   - `texto_boton: 'Validar y Desbloquear Acceso'`
5. **Portal Corporativo SSO:**
   - `tipo_base: 'corporativo'`
   - `nombre: 'Portal Corporativo SSO'`
   - `titulo_portal: 'Portal de Acceso Corporativo'`
   - `subtitulo: 'Inicio de Sesión Único (SSO)'`
   - `color_primario: '#0f172a'`
   - `color_fondo: '#1e293b'`
   - `label_usuario: 'Usuario de Red / Correo Institucional'`
   - `label_password: 'Contraseña de Dominio'`
   - `texto_boton: 'Acceder a Sistemas Internos'`

### 1.3. Modificación en `plantillas`
- Columna `landing_id INT NULL REFERENCES portales_simulados(id) ON DELETE SET NULL`.
- Actualización de CHECK constraint de `landing_tipo` para admitir `'unjbg'` y `'personalizado'`.
- Actualización de `phishwarden.sql` y `prisma/schema.prisma`.
- Regeneración del cliente Prisma v5 (`npx prisma generate`).

---

## 2. Módulo Hexagonal `src/portales/`

### 2.1. Dominio (`src/portales/domain/`)
- `portal.entity.ts`:
  - Entidad de dominio pura `PortalEntity` con constructor y atributos: `id`, `empresaId`, `nombre`, `tipoBase`, `tituloPortal`, `subtitulo`, `logoUrl`, `colorPrimario`, `colorFondo`, `labelUsuario`, `labelPassword`, `textoBoton`, `fechaCreacion`.
  - Enum `PortalTipoBase = 'unjbg' | 'microsoft' | 'google' | 'bancario' | 'corporativo' | 'personalizado'`.

### 2.2. Aplicación (`src/portales/application/`)
- `portal.repository.port.ts`:
  - Token constante: `PORTAL_REPOSITORY_PORT`.
  - Métodos: `findByCompany(companyId: number)`, `findById(id: number)`, `create(data: CreatePortalData)`, `update(id: number, data: UpdatePortalData)`, `delete(id: number)`.
- Casos de uso:
  - `get-portals.use-case.ts`: Retorna portales globales (`empresa_id = null`) y propios de la empresa (`empresa_id = companyId`).
  - `get-portal-by-id.use-case.ts`: Retorna el portal si es global o pertenece a la empresa.
  - `create-portal.use-case.ts`: Crea un portal personalizado asignado al `empresaId` (fuerza `tipoBase = 'personalizado'` a menos que se defina explícitamente).
  - `update-portal.use-case.ts`: Valida que el portal exista, no sea global (`empresa_id !== null`; si es global, arroja `ForbiddenException`) y pertenezca a la empresa.
  - `delete-portal.use-case.ts`: Valida que no sea global (`ForbiddenException` ante portal del sistema) y pertenezca a la empresa.

### 2.3. Infraestructura (`src/portales/infrastructure/`)
- DTOs con validaciones `class-validator` y Swagger:
  - `create-portal.dto.ts`
  - `update-portal.dto.ts`
- Adaptador Prisma:
  - `prisma-portal.repository.ts`: Implementa `PortalRepositoryPort`.
- Controlador REST:
  - `portales.controller.ts`:
    - `@ApiTags('portales')`
    - `@ApiBearerAuth()`
    - `@UseGuards(JwtAuthGuard, CompanyTenantGuard)`
    - Rutas:
      - `GET /empresas/:empresaId/portales`
      - `GET /empresas/:empresaId/portales/:id`
      - `POST /empresas/:empresaId/portales`
      - `PUT /empresas/:empresaId/portales/:id`
      - `DELETE /empresas/:empresaId/portales/:id`
- Módulo NestJS:
  - `portales.module.ts`: Exporta `GetPortalsUseCase`, `GetPortalByIdUseCase` y `PORTAL_REPOSITORY_PORT`.

---

## 3. Integración en `src/plantillas/`

- Actualizar `LandingType` con valores `'unjbg'` y `'personalizado'`.
- En `create-template.dto.ts` y `update-template.dto.ts`:
  - Añadir `@IsOptional() @IsInt() landingId?: number | null`.
- En `create-template.use-case.ts` y `update-template.use-case.ts`:
  - Si se envía `landingId`, validar contra `PortalRepositoryPort` que el portal exista y sea global o pertenezca a la empresa (`BadRequestException` si no existe o no está autorizado).
- En `prisma-template.repository.ts`:
  - Mapear `landing_id` bidireccionalmente.

---

## 4. Integración en `src/simulaciones/` (`GET /track/context/:token`)

- En `simulation-tracking.repository.port.ts`:
  - Enriquecer `TrackingParticipantDetail` con datos de `portalConfig` y `plantillaLandingId`.
- En `prisma-simulation-tracking.repository.ts`:
  - En `findParticipantByToken`, incluir la relación `plantillas.portales_simulados` o resolver el portal global por `landing_id` o `landing_tipo`.
- En `get-simulation-context.use-case.ts`:
  - Retornar objeto `portalConfig`:
    ```json
    {
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
    ```
  - Si la plantilla tiene `landingId`, retornar ese portal; si no, resolver por `landingTipo` contra los portales globales (ej. `'unjbg'`, `'microsoft'`, etc.).

---

## 5. Reglas de Calidad y Criterios de Aceptación

- `import type` obligatorio en parámetros de constructores inyectados.
- Registro de `PortalesModule` en `app.module.ts`.
- Actualización exhaustiva de `specs/API_CONTRACTS.md`.
- `npm run build` con **0 errores de TypeScript**.
