# Constitución técnica de PhishWarden Backend

## 1. Stack y Versiones Obligatorias

- **Framework:** NestJS con TypeScript estricto.
- **Regla Crítica de Compilación (`tsconfig.json`):** Dado que `isolatedModules` y `emitDecoratorMetadata` están habilitados, **es obligatorio usar `import type` para importar interfaces/puertos** en firmas de constructores decorados con `@Injectable()` o `@Controller()` (evitando errores `TS1272`).
- **ORM:** Prisma v5 (`@prisma/client@5.22.0` y `prisma@5.22.0` según `package.json`). **PROHIBIDO** actualizar a Prisma v6, v7 o v8. Ejecutar comandos siempre con `npx prisma ...`.
- **Base de datos:** PostgreSQL en Supabase. La fuente única de verdad del esquema es `prisma/schema.prisma` (alineado a `phishwarden.sql`).
- **Documentación API:** Swagger (`@nestjs/swagger`) configurado en `/api/docs` con soporte Bearer JWT (`addBearerAuth()`).

## 2. Arquitectura: Monolito Modular Hexagonal (Puertos y Adaptadores)

Los módulos existentes son `auth`, `empresas`, `departamentos`, `empleados`, `plantillas` y `campanas`.

- **Regla de Dependencia (Estricta):** `Infrastructure` -> `Application` -> `Domain`.
- **Pureza de Dominio y Aplicación:** **PROHIBIDO** importar `@prisma/client`, `@nestjs/swagger` o decoradores HTTP dentro de `domain/` o `application/`.
- **Inversión de Dependencias:** Los casos de uso en `application/` dependen únicamente de interfaces (`*RepositoryPort`) definidas en `application/` e inyectadas mediante constantes/tokens de NestJS (`@Inject(TOKEN_CONST)`).
- **Estructura Obligatoria por Módulo (`src/<nombre-modulo>/`):**
  1. `domain/`: Entidades puras (`*.entity.ts`), enums de negocio e invariantes.
  2. `application/`: Casos de uso (`*.use-case.ts`), puertos de repositorio (`*.repository.port.ts` + token constante) y DTOs/interfaces internas de aplicación (`*-summary.dto.ts`, queries).
  3. `infrastructure/`: Controladores REST (`*.controller.ts`) con decoradores Swagger y Guards, DTOs de validación HTTP (`*.dto.ts` con `class-validator` y `class-transformer`) y repositorios concretos Prisma (`prisma-*.repository.ts`).
  4. `<modulo>.module.ts`: Conecta los tokens de puertos con sus implementaciones Prisma (`{ provide: TOKEN, useClass: PrismaRepository }`), importa `PrismaModule` y exporta únicamente los Casos de Uso públicos.
- **Aislamiento Modular (`src/prisma/`):** Un módulo **nunca** debe importar el repositorio Prisma de otro módulo; la comunicación entre módulos se realiza exclusivamente invocando Casos de Uso exportados.

## 3. Reglas de Base de Datos, Tipado e Identificadores (`phishwarden.sql`)

- **Identificadores Híbridos (Regla Crítica):** Respetar estrictamente el tipo de PK de cada tabla:
  - **UUIDv4** (validar con `ParseUUIDPipe` / `@IsUUID('4')`): `usuarios`, `campanas`, `campana_usuarios`, `eventos_simulacion`.
  - **SERIAL / INT** (validar con `ParseIntPipe` / `@IsInt()`): `empresas`, `administradores`, `departamentos`, `plantillas`, `microlecciones`, `preguntas_evaluacion`, `logros_usuarios`, `insignias_medallas`.
- **Restricciones `CHECK` de PostgreSQL:** Validar estrictamente en DTOs y entidades los valores permitidos:
  - `plantillas.metodo_ataque`: `'phishing' | 'smishing'`
  - `plantillas.indicador_dificultad`: `'baja' | 'media' | 'alta'`
  - `campanas.modalidad_envio`: `'masivo' | 'escalonado'`
  - `campanas.estado`: `'programada' | 'en_curso' | 'finalizada' | 'cancelada'`
  - `eventos_simulacion.tipo_evento`: `'enviado' | 'abierto' | 'click' | 'formulario_enviado' | 'descarga_adjunto'`
  - `usuarios.score_riesgo`: Entero acotado entre `0` y `100` (`CHECK (score_riesgo BETWEEN 0 AND 100)`).
  - `preguntas_evaluacion.respuesta_correcta`: `'A' | 'B' | 'C' | 'D'`
  - `logros_usuarios.estado`: `'completada' | 'reprobada'`
- **Paginación Estándar:** Todo listado paginado debe devolver `{ data, total, page, limit }`.

## 4. Reglas Transversales de Negocio y Seguridad (Multi-tenant y Zero-Credential)

- **Autenticación y Aislamiento Multi-tenant (`empresa_id`):**
  - Toda ruta administrativa bajo `/empresas/:empresaId/...` debe estar protegida por `JwtAuthGuard` y `CompanyTenantGuard`, verificando que el `empresaId` extraído del token JWT coincida con el `:empresaId` de la ruta.
  - Ningún usuario, departamento, plantilla personalizada o campaña de una empresa puede ser consultado o vinculado por otra empresa.
  - Diferenciar claramente los tokens JWT de **Administradores Web** (`administradores`) de los tokens JWT de **Colaboradores Móviles** (`usuarios` vinculados vía `codigo_acceso`).
- **Cumplimiento Estricto Zero-Credential:** En el módulo de rastreo (`eventos_simulacion`), está **ESTRICTAMENTE PROHIBIDO** almacenar, loguear o procesar contraseñas, PINs o cualquier payload ingresado en formularios simulados. Solo se registran metadatos (`tipo_evento`, `ip_anonimizada`, `user_agent`, `fecha_hora`).
- **Validación y Seguridad HTTP:**
  - Jamás exponer `password_hash` en respuestas HTTP.
  - `ValidationPipe` global configurado con `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
  - Para fechas ISO 8601 en DTOs, usar `@Type(() => Date)` junto con `@IsDate()` para compatibilidad con `transform: true`.

## 5. Hoja de Ruta Oficial por Fases

- **Fase 0: Blindaje JWT y Multi-tenant**
- **Fase 1: Motor de Campañas**
- **Fase 2: Rastreo y Eventos Zero-Credential**
- **Fase 3: Backend App Móvil y FCM**
- **Fase 4: Capacitación y Gamificación**
- **Fase 5: Analítica Ejecutiva**
- **Fase 6: Rate Limiting y Cierre de Contratos**

## 6. Criterio de Aceptación por Fase

Ninguna fase o tarea de `tasks.md` se considera terminada hasta que:

1. Se respete estrictamente la separación `domain` / `application` / `infrastructure` sin fugas de Prisma hacia el dominio o aplicación.
2. Se use `import type` en todas las interfaces inyectadas en constructores decorados.
3. `npm run build` compile con **0 errores** de TypeScript.
4. Todos los controladores y DTOs tengan decoradores de Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty`, `@ApiBearerAuth`) y el servidor levante correctamente en `/api/docs`.
5. Se actualice `specs/API_CONTRACTS.md` documentando los endpoints, parámetros, payloads JSON, seguridad requerida y respuestas de la fase.
