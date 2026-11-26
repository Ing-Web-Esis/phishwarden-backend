# Fase 2.5 Backend - Portales Simulados Globales y Personalizados (Incluyendo Aula Virtual UNJBG)

## Objetivo

Incorporar el catálogo multi-tenant de **Portales Simulados** (`portales_simulados`) en `phishwarden-backend-nj/`, incluyendo los portales globales del sistema (entre ellos **Aula Virtual UNJBG**) y la capacidad para que cada empresa cree, edite y elimine sus propios portales personalizados con identidad visual propia, vinculándolos a `plantillas` y exponiendo su configuración segura en `GET /track/context/:token`.

## Alcance

### Incluido

1. **Esquema de Base de Datos (`portales_simulados` y relación en `plantillas`):**
   - Crear tabla `portales_simulados`:
     - `id SERIAL PRIMARY KEY`
     - `empresa_id INT NULL REFERENCES empresas(id) ON DELETE CASCADE` (`NULL` = portal global del sistema)
     - `nombre VARCHAR(100) NOT NULL`
     - `tipo_base VARCHAR(30) NOT NULL DEFAULT 'personalizado'` (`'unjbg' | 'microsoft' | 'google' | 'bancario' | 'corporativo' | 'personalizado'`)
     - `titulo_portal VARCHAR(150) NOT NULL`
     - `subtitulo VARCHAR(255) NULL`
     - `logo_url TEXT NULL`
     - `color_primario VARCHAR(20) NOT NULL DEFAULT '#0067b8'`
     - `color_fondo VARCHAR(20) NOT NULL DEFAULT '#f3f4f6'`
     - `label_usuario VARCHAR(80) NOT NULL DEFAULT 'Correo electrónico o usuario'`
     - `label_password VARCHAR(80) NOT NULL DEFAULT 'Contraseña'`
     - `texto_boton VARCHAR(60) NOT NULL DEFAULT 'Iniciar sesión'`
     - `fecha_creacion TIMESTAMPTZ DEFAULT NOW()`
   - Insertar (idempotente) los 5 **Portales Globales (`empresa_id = NULL`)**:
     1. `Aula Virtual UNJBG` (`tipo_base: 'unjbg'`, `titulo_portal: 'Aula Virtual - UNJBG'`, `color_primario: '#1d4ed8'`, `label_usuario: 'Nombre de usuario'`, `label_password: 'Contraseña'`, `texto_boton: 'Acceder'`)
     2. `Microsoft 365 / Outlook` (`tipo_base: 'microsoft'`)
     3. `Google Workspace` (`tipo_base: 'google'`)
     4. `Validación Bancaria` (`tipo_base: 'bancario'`)
     5. `Portal Corporativo SSO` (`tipo_base: 'corporativo'`)
   - Añadir columna opcional `landing_id INT NULL REFERENCES portales_simulados(id) ON DELETE SET NULL` en `plantillas` y sincronizar `prisma/schema.prisma`.

2. **Módulo CRUD Multi-Tenant `src/portales/` (Arquitectura Hexagonal):**
   - `GET /empresas/:empresaId/portales`: Retorna portales globales (`empresa_id = null`) y propios (`empresa_id = empresaId`).
   - `POST /empresas/:empresaId/portales`: Crea un portal personalizado asociado a `empresaId` (fuerza `tipo_base = 'personalizado'`).
   - `PUT /empresas/:empresaId/portales/:id`: Actualiza un portal propio; rechaza con `403 Forbidden` si `empresa_id` es `null` (portal global) o pertenece a otra empresa.
   - `DELETE /empresas/:empresaId/portales/:id`: Elimina un portal propio; rechaza con `403 Forbidden` si es global o ajeno.

3. **Integración con `plantillas` y `GET /track/context/:token`:**
   - Permitir `landingId?: number | null` en `CreateTemplateDto` y `UpdateTemplateDto` (validando que el portal exista y sea global o pertenezca al tenant), y soportar `'unjbg'` y `'personalizado'` en `LandingType`.
   - Actualizar `GetSimulationContextUseCase` (`GET /track/context/:token`) para incluir `portalConfig` (cuando la plantilla tenga `landingId` o corresponda a un portal global) con `{ id, nombre, tipoBase, tituloPortal, subtitulo, logoUrl, colorPrimario, colorFondo, labelUsuario, labelPassword, textoBoton }`, manteniendo retrocompatibilidad con `landingTipo`.
   - Actualizar `phishwarden-backend-nj/specs/API_CONTRACTS.md`.

### Excluido

- Ejecución de JavaScript o HTML arbitrario definido por usuarios (prohibido por seguridad XSS y Zero-Credential Storage).
- Funcionalidades móviles FCM de Fase 3.

## Criterios de aceptación

- Existen los 5 portales globales en BD, incluyendo `Aula Virtual UNJBG`.
- Cada empresa puede gestionar (CRUD) sus portales personalizados aislados por `empresa_id`, sin poder modificar ni eliminar los globales (`403 Forbidden`).
- Las plantillas pueden vincularse mediante `landingId` (o `landingTipo: 'unjbg'`).
- `GET /track/context/:token` retorna `landingTipo` y `portalConfig` sin datos sensibles.
- `npm run build` compila con **0 errores de TypeScript**.