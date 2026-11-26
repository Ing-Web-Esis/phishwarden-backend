# Fase 0 - Blindaje JWT y Multi-tenant

## Objetivo

Auditar y aplicar de forma obligatoria `JwtAuthGuard` y `CompanyTenantGuard` sobre los módulos ya creados antes de continuar con el módulo de campañas:

- `empresas`
- `departamentos`
- `empleados`
- `plantillas`

El módulo `campanas` no se amplía ni modifica funcionalmente en esta fase, pero todas sus rutas nuevas o existentes deben permanecer bloqueadas hasta que exista el blindaje transversal y se complete su integración posterior.

## Alcance

### Incluido

1. Inventario de rutas administrativas protegidas y pendientes.
2. Aplicación de `JwtAuthGuard` a todas las rutas administrativas.
3. Implementación de `CompanyTenantGuard` y su registro como proveedor/exportación reutilizable.
4. Comparación estricta entre:
   - `empresaId` de la ruta (`:empresaId`);
   - `empresaId` contenido en el JWT de administrador web.
5. Validación de IDs según el tipo real de PK:
   - INT con `ParseIntPipe` para empresas, departamentos y plantillas;
   - UUIDv4 con `ParseUUIDPipe` para usuarios y campañas.
6. Revisión de repositorios para impedir consultas cruzadas entre empresas.
7. Actualización de Swagger con `@ApiBearerAuth()` y respuestas 401/403.
8. Actualización de `specs/API_CONTRACTS.md` con el estado final de protección.

### Excluido

- Cambios de dominio de campañas.
- Nuevos endpoints móviles.
- Eventos de simulación y cumplimiento Zero-Credential.
- FCM, gamificación y analítica.

## Estado inicial requerido por la auditoría

- `JwtAuthGuard` existe en `src/auth/infrastructure/jwt-auth.guard.ts`.
- `JwtAuthGuard` está aplicado a `GET/PUT /auth/me`, `GET /departamentos` y `GET /empleados/:id`.
- `CompanyTenantGuard` todavía no existe en el repositorio.
- Las rutas de `/empresas/:empresaId/departamentos`, `/empresas/:empresaId/empleados` y `/empresas/:empresaId/plantillas` no están protegidas.
- Las rutas de `/empresas/:empresaId/campanas` no están protegidas.
- `POST /empresas/register` y `POST /auth/login` deben permanecer públicos.

## Reglas funcionales

1. Toda ruta administrativa bajo `/empresas/:empresaId/...` debe usar ambos guards:

```text
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
```

2. `CompanyTenantGuard` debe rechazar con 403 cuando:
   - el token no corresponde a un administrador web;
   - el token no contiene `empresaId`;
   - el `empresaId` del token no coincide con `:empresaId`;
   - el recurso solicitado no pertenece al tenant autenticado.

3. Los controladores basados directamente en el usuario autenticado (`/departamentos`, `/empleados/:id`) deben derivar el tenant del JWT y no aceptar otro `empresaId` del cliente.

4. Los repositorios deben aplicar filtros por `empresa_id`/relaciones equivalentes en lecturas, actualizaciones y eliminaciones. Ninguna operación puede confiar únicamente en el ID del recurso.

5. Los IDs de ruta deben validarse antes de alcanzar Prisma:
   - `empresas`, `departamentos` y `plantillas`: INT;
   - `usuarios` y `campanas`: UUIDv4.

6. Las respuestas nunca deben incluir `administradores.password_hash`.

## Diseño técnico obligatorio

- `CompanyTenantGuard` debe ubicarse en el módulo `auth` o en una ubicación transversal bajo `src/` reutilizable por los módulos protegidos.
- Si se importa una interfaz o puerto en un constructor decorado, se usará `import type`.
- Los módulos de `departamentos`, `empleados` y `plantillas` deberán importar `AuthModule` y proveer o exportar los guards necesarios según NestJS.
- La comunicación modular seguirá usando Casos de Uso exportados; ningún módulo importará directamente el repositorio Prisma de otro.

## Plan de implementación

1. Crear `CompanyTenantGuard` y sus tipos de identidad mínimo.
2. Extender o reutilizar el payload JWT para incluir `sub`, `role` y `empresaId`.
3. Registrar y exportar los guards desde `AuthModule`.
4. Auditar los controladores de `empresas`, `departamentos`, `empleados` y `plantillas`.
5. Aplicar ambos guards a todas las rutas administrativas con `:empresaId`.
6. Añadir validadores de UUIDv4/INT donde falten.
7. Añadir o corregir filtros tenant en repositorios Prisma.
8. Completar decoradores Swagger: tags, operación, respuestas, Bearer y errores 401/403.
9. Ejecutar `npm run build`.
10. Actualizar `specs/API_CONTRACTS.md`.

## Criterios de aceptación

- Ninguna ruta administrativa existente de `empresas`, `departamentos`, `empleados` o `plantillas` queda expuesta sin JWT.
- Ninguna ruta con `:empresaId` acepta una empresa distinta a la contenida en el JWT.
- Las rutas públicas están limitadas explícitamente a login y registro inicial.
- Las rutas de campañas siguen bloqueadas hasta que sus requisitos de tenant sean implementados.
- No hay fugas de datos entre empresas ni exposición de `password_hash`.
- Los IDs de ruta usan los validadores definidos por su tipo real.
- `npm run build` termina con 0 errores.
- Swagger muestra Bearer JWT y documenta respuestas 401/403.
