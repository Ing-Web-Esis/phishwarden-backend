# Plan Técnico: Fase 0 - Blindaje JWT y Multi-tenant

## 1. Diagnóstico de la Arquitectura de Seguridad Actual (`src/auth/`)

### 1.1. Estado de los Componentes Existentes
- **Estrategia JWT (`JwtStrategy`):** Actualmente **no** se utiliza `PassportStrategy` ni `@nestjs/passport`. La autenticación se maneja directamente en NestJS mediante `@nestjs/jwt` (`JwtService`).
- **Guard de Autenticación (`JwtAuthGuard`):** Ubicado en `src/auth/infrastructure/jwt-auth.guard.ts`. Implementa `CanActivate`, extrae el token del header `Authorization: Bearer <token>`, lo valida asíncronamente con `jwtService.verifyAsync` e inyecta el payload verificado en `request.user`.
- **Payload JWT Generado:** En `src/auth/application/login.use-case.ts` (líneas 38-42), el flujo de login administrativo web genera el token con la siguiente estructura:
  ```typescript
  {
    sub: admin.id,        // ID entero del administrador
    role: admin.role,      // 'administrador'
    empresaId: admin.empresaId, // ID entero de la empresa asociada (o undefined)
  }
  ```
- **Falta de Aislamiento Multi-tenant Transversal:** Aunque `JwtAuthGuard` inyecta `request.user`, **no existe ningún guard que valide la coincidencia de tenant** entre `request.user.empresaId` y el parámetro `:empresaId` de las rutas administrativas (`/empresas/:empresaId/...`).

### 1.2. Diseño e Implementación de `CompanyTenantGuard`
- **Ubicación:** `src/auth/infrastructure/company-tenant.guard.ts`.
- **Cumplimiento de Reglas de Dependencia (`Infrastructure -> Application -> Domain`):**
  - Al ser un mecanismo de intercepción HTTP propio del framework NestJS (`ExecutionContext`, `CanActivate`, excepciones HTTP como `ForbiddenException`), pertenece estrictamente a la capa de **Infrastructure**.
  - **No** contamina ni importa nada de `domain/` ni de `application/`.
  - **No** realiza consultas a Prisma ni acopla módulos a la base de datos: opera en memoria ($O(1)$) validando el payload criptográficamente firmado por `JwtAuthGuard` contra los parámetros de la solicitud HTTP.
- **Lógica de Ejecución de `CompanyTenantGuard`:**
  1. Obtiene `request` desde `context.switchToHttp().getRequest()`.
  2. Verifica la presencia de `request.user` (garantizada previamente por la ejecución de `JwtAuthGuard`). Si no existe, lanza `UnauthorizedException('Usuario no autenticado')`.
  3. Valida el rol: `request.user.role === 'administrador'`. Si no corresponde, lanza `ForbiddenException('Acceso restringido a administradores web')`.
  4. Valida que el administrador tenga empresa asignada: `request.user.empresaId !== undefined && request.user.empresaId !== null`. Si no, lanza `ForbiddenException('El administrador no tiene una empresa asignada')`.
  5. Extrae `request.params.empresaId`. Si el parámetro existe en la ruta:
     - Lo convierte a entero (`parseInt(request.params.empresaId, 10)`).
     - Compara: `Number(request.user.empresaId) === routeEmpresaId`.
     - Si difieren o es inválido, rechaza inmediatamente con `ForbiddenException('Acceso denegado: no tienes permisos sobre esta empresa')` (HTTP 403).
  6. Retorna `true`.
- **Exportación y Consumo Modular:**
  - `AuthModule` registra `CompanyTenantGuard` en `providers` y lo añade a `exports` junto con `JwtAuthGuard` y `JwtModule`.
  - Los módulos `departamentos`, `empleados`, `plantillas` y `campanas` importan `AuthModule` en sus respectivos `*.module.ts`, permitiendo aplicar `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` sin duplicar lógica ni generar acoplamientos circulares.

---

## 2. Inventario de Controladores, Rutas y Repositorios Prisma a Modificar

### 2.1. Configuración Global (`main.ts`)
- **`ValidationPipe` Global:**
  - **Diagnóstico actual:** Configurado con `whitelist: true`, `transform: true` y `enableImplicitConversion: true`, pero **carece** de `forbidNonWhitelisted: true`.
  - **Acción:** Configurar `{ whitelist: true, forbidNonWhitelisted: true, transform: true }` según la Constitución Técnica para bloquear payloads con propiedades no declaradas (HTTP 400).
- **Swagger (`DocumentBuilder`):**
  - **Diagnóstico actual:** Contiene `addBearerAuth()` y tags de `auth`, `empresas` y `empleados`.
  - **Acción:** Asegurar el soporte de Bearer Auth global en Swagger y documentar las etiquetas de los módulos restantes (`departamentos`, `plantillas`, `campanas`).

---

### 2.2. Módulo Departamentos (`src/departamentos/`)
- **`DepartamentosController` (`src/departamentos/infrastructure/departamentos.controller.ts`):**
  - **Ruta base:** `/empresas/:empresaId/departamentos`
  - **Acción:**
    - Aplicar a nivel de controlador: `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()`.
    - Añadir decoradores `@ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })` y `@ApiResponse({ status: 403, description: 'Acceso denegado a los datos de la empresa.' })`.
    - Rutas protegidas:
      - `GET /empresas/:empresaId/departamentos` (usa `ParseIntPipe` en `empresaId`).
      - `POST /empresas/:empresaId/departamentos` (usa `ParseIntPipe` en `empresaId`).
- **`AdminDepartamentosController` (`src/departamentos/infrastructure/admin-departamentos.controller.ts`):**
  - **Ruta:** `GET /departamentos`
  - Ya cuenta con `JwtAuthGuard` y `@ApiBearerAuth()`. Deriva el tenant de `request.user.empresaId` (Regla 3 de la especificación). Se mantiene conforme.
- **`PrismaDepartmentRepository` (`src/departamentos/infrastructure/prisma-department.repository.ts`):**
  - Validar que todas las operaciones (`findByCompany`, `findStatsByCompany`, `findById`, `findByName`, `create`) mantengan el aislamiento con `where: { empresa_id: companyId }`.
  - En `delete(id, companyId)`: Asegurar el uso de `deleteMany({ where: { id, empresa_id: companyId } })` para evitar errores de claves no únicas en Prisma y garantizar el borrado exclusivo dentro del tenant.

---

### 2.3. Módulo Empleados (`src/empleados/`)
- **`EmpleadosController` (`src/empleados/infrastructure/empleados.controller.ts`):**
  - **Ruta base:** `/empresas/:empresaId/empleados`
  - **Acción:**
    - Aplicar a nivel de clase: `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()`.
    - Añadir respuestas Swagger 401 y 403 en todas las rutas.
    - Rutas protegidas y validación de tipos de identificadores:
      - `POST /empresas/:empresaId/empleados/import-csv`: `empresaId` con `ParseIntPipe`.
      - `GET /empresas/:empresaId/empleados`: `empresaId` con `ParseIntPipe`. Query validado con `GetEmployeesQueryDto`.
      - `POST /empresas/:empresaId/empleados`: `empresaId` con `ParseIntPipe`. Body validado con `CreateEmployeeDto`.
      - `PUT /empresas/:empresaId/empleados/:id`: `empresaId` con `ParseIntPipe`. **Modificar `id` para usar `ParseUUIDPipe`** (actualmente sin pipe, tipo `string`).
      - `DELETE /empresas/:empresaId/empleados/:id`: `empresaId` con `ParseIntPipe`. **Modificar `id` para usar `ParseUUIDPipe`** (actualmente sin pipe, tipo `string`).
      - `GET /empresas/:empresaId/empleados/resumen`: `empresaId` con `ParseIntPipe`.
- **`AdminEmpleadosController` (`src/empleados/infrastructure/admin-empleados.controller.ts`):**
  - **Ruta:** `GET /empleados/:id`
  - **Acción:** Modificar el parámetro `id` para usar `ParseUUIDPipe`: `@Param('id', ParseUUIDPipe) employeeId: string`. Mantiene `JwtAuthGuard` y derivación de `request.user.empresaId`.
- **`PrismaEmployeeRepository` (`src/empleados/infrastructure/prisma-employee.repository.ts`):**
  - **Vulnerabilidad Crítica Detectada:**
    - `updateEmployee`: Actualmente ejecuta `this.prisma.usuarios.update({ where: { id }, data })` sin filtrar por `empresa_id: companyId`. Esto permite modificar un empleado de otra empresa si se conoce su UUID.
    - `deleteEmployee`: Actualmente ejecuta `this.prisma.usuarios.delete({ where: { id } })` sin filtrar por `empresa_id: companyId`.
  - **Corrección Requerida:**
    - En `updateEmployee`: Verificar primero la pertenencia con `findEmployeeById(companyId, id)` (o actualizar condicionado a `empresa_id: companyId`). Si no existe o pertenece a otra empresa, retornar `null` (disparando `NotFoundException` en el caso de uso).
    - En `deleteEmployee`: Ejecutar `this.prisma.usuarios.deleteMany({ where: { id, empresa_id: companyId } })`. Si `count === 0`, el caso de uso retornará que el recurso no fue encontrado.
  - **Filtro Opcional `departmentId` en Resumen:**
    - Verificar en `findSummaryByCompany` que si `departmentId` está definido en el query (`departmentId !== undefined`), se normalice como número `Number(departmentId)` y se filtre estrictamente por `{ empresa_id: companyId, departamento_id: Number(departmentId) }`.

---

### 2.4. Módulo Plantillas (`src/plantillas/`)
- **`PlantillasModule` (`src/plantillas/plantillas.module.ts`):**
  - **Acción:** Importar `AuthModule` para disponer de `JwtAuthGuard` y `CompanyTenantGuard`.
- **`PlantillasController` (`src/plantillas/infrastructure/plantillas.controller.ts`):**
  - **Ruta base:** `/empresas/:empresaId/plantillas`
  - **Acción:**
    - Aplicar a nivel de clase: `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()`.
    - Añadir respuestas Swagger 401 y 403.
    - Modificar endpoints de actualización y eliminación:
      - `PUT /empresas/:empresaId/plantillas/:id`:
        - Agregar `@Param('empresaId', ParseIntPipe) empresaId: number`.
        - Cambiar `@Param('id') id: string` por `@Param('id', ParseIntPipe) id: number`.
        - Invocar: `this.updateTemplateUseCase.execute(empresaId, id, dto)`.
      - `DELETE /empresas/:empresaId/plantillas/:id`:
        - Agregar `@Param('empresaId', ParseIntPipe) empresaId: number`.
        - Cambiar `@Param('id') id: string` por `@Param('id', ParseIntPipe) id: number`.
        - Invocar: `this.deleteTemplateUseCase.execute(empresaId, id)`.
- **Casos de Uso de Plantillas y Protección de Plantillas Globales:**
  - **`UpdateTemplateUseCase` (`src/plantillas/application/update-template.use-case.ts`):**
    - Parámetros: `(companyId: number, templateId: number, input: UpdateTemplateInput)`.
    - Regla de negocio:
      1. Obtener la plantilla mediante `templateRepository.findById(templateId)`.
      2. Si no existe, lanzar `NotFoundException('La plantilla de phishing no fue encontrada.')`.
      3. **Protección Global:** Si `template.isGlobal` o `template.empresaId === null`, lanzar `ForbiddenException('No se pueden modificar plantillas globales del sistema')`.
      4. **Aislamiento Multi-tenant:** Si `template.empresaId !== companyId`, lanzar `ForbiddenException('No tienes permisos para modificar esta plantilla')`.
      5. Proceder a la actualización en el repositorio.
  - **`DeleteTemplateUseCase` (`src/plantillas/application/delete-template.use-case.ts`):**
    - Parámetros: `(companyId: number, templateId: number)`.
    - Regla de negocio:
      1. Obtener la plantilla mediante `templateRepository.findById(templateId)`.
      2. Si no existe, lanzar `NotFoundException('La plantilla de phishing no existe.')`.
      3. **Protección Global:** Si `template.isGlobal` o `template.empresaId === null`, lanzar `ForbiddenException('No se pueden eliminar plantillas globales del sistema')`.
      4. **Aislamiento Multi-tenant:** Si `template.empresaId !== companyId`, lanzar `ForbiddenException('No tienes permisos para eliminar esta plantilla')`.
      5. Proceder a la eliminación en el repositorio.
- **Puerto y Repositorio Prisma de Plantillas:**
  - Actualizar `TemplateRepositoryPort` para manejar identificadores enteros (`id: number`) y el filtro por empresa (`companyId: number`) en `update` y `delete`.
  - En `PrismaTemplateRepository`:
    - `findById(id: number)`: Buscar por `id` numérico.
    - `update(companyId: number, id: number, data)`: Asegurar que el where de Prisma aplique sobre `id` y verifique la pertenencia.
    - `delete(companyId: number, id: number)`: Usar `deleteMany({ where: { id, empresa_id: companyId } })`.

---

### 2.5. Módulo Campañas (`src/campanas/`) - Bloqueo Preventivo
- **`CampanasModule` (`src/campanas/campanas.module.ts`):**
  - **Acción:** Importar `AuthModule` para inyectar los guards.
- **`CampanasController` (`src/campanas/infrastructure/campanas.controller.ts`):**
  - **Ruta base:** `/empresas/:empresaId/campanas`
  - **Acción:**
    - Aplicar a nivel de clase: `@UseGuards(JwtAuthGuard, CompanyTenantGuard)` y `@ApiBearerAuth()`.
    - Bloqueo preventivo: Ningún usuario anónimo ni administrador de otra empresa podrá invocar estas rutas.
    - Tipado e identificadores:
      - `GET /empresas/:empresaId/campanas`: `ParseIntPipe` en `empresaId`.
      - `GET /empresas/:empresaId/campanas/:id`: `ParseIntPipe` en `empresaId` y `ParseUUIDPipe` en `id`.
      - `POST /empresas/:empresaId/campanas`: `ParseIntPipe` en `empresaId`.
      - `PATCH /empresas/:empresaId/campanas/:id/cancelar`: `ParseIntPipe` en `empresaId` y `ParseUUIDPipe` en `id`.
    - Documentar en Swagger las respuestas 401 y 403.

---

## 3. Matriz Resumen de Rutas y Seguridad

| Método | Endpoint | Acceso | Guards Requeridos | Pipes de Validación |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Público | Ninguno | `LoginDto` |
| `GET` | `/auth/me` | Privado | `JwtAuthGuard` | - |
| `PUT` | `/auth/me` | Privado | `JwtAuthGuard` | `UpdateAdminProfileDto` |
| `POST` | `/empresas/register` | Público | Ninguno | `RegisterCompanyDto` |
| `GET` | `/empresas/:empresaId/departamentos` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe` |
| `POST` | `/empresas/:empresaId/departamentos` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Body: `CreateDepartmentDto` |
| `GET` | `/departamentos` | Admin Autenticado | `JwtAuthGuard` | Tenant derivado de JWT |
| `POST` | `/empresas/:empresaId/empleados/import-csv` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, File CSV |
| `GET` | `/empresas/:empresaId/empleados` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Query: `GetEmployeesQueryDto` |
| `POST` | `/empresas/:empresaId/empleados` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Body: `CreateEmployeeDto` |
| `PUT` | `/empresas/:empresaId/empleados/:id` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, `id`: `ParseUUIDPipe`, Body |
| `DELETE` | `/empresas/:empresaId/empleados/:id` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, `id`: `ParseUUIDPipe` |
| `GET` | `/empresas/:empresaId/empleados/resumen` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Query (con `departmentId`) |
| `GET` | `/empleados/:id` | Admin Autenticado | `JwtAuthGuard` | `id`: `ParseUUIDPipe`, Tenant derivado de JWT |
| `GET` | `/empresas/:empresaId/plantillas` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Query: `GetTemplatesQueryDto` |
| `POST` | `/empresas/:empresaId/plantillas` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Body: `CreateTemplateDto` |
| `PUT` | `/empresas/:empresaId/plantillas/:id` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, `id`: `ParseIntPipe`, Body (bloqueo global) |
| `DELETE` | `/empresas/:empresaId/plantillas/:id` | Admin Tenant | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, `id`: `ParseIntPipe` (bloqueo global) |
| `GET` | `/empresas/:empresaId/campanas` | Bloqueo preventivo | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Query |
| `GET` | `/empresas/:empresaId/campanas/:id` | Bloqueo preventivo | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, `id`: `ParseUUIDPipe` |
| `POST` | `/empresas/:empresaId/campanas` | Bloqueo preventivo | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, Body |
| `PATCH` | `/empresas/:empresaId/campanas/:id/cancelar` | Bloqueo preventivo | `JwtAuthGuard`, `CompanyTenantGuard` | `empresaId`: `ParseIntPipe`, `id`: `ParseUUIDPipe` |

---

## 4. Riesgos Mitigados y Reglas de Verificación

1. **Inyección de IDs y Type Confusion:** Garantizado mediante `ParseIntPipe` para tablas con PK SERIAL (`empresas`, `departamentos`, `plantillas`) y `ParseUUIDPipe` para tablas con PK UUIDv4 (`usuarios`, `campanas`).
2. **IDOR / Fuga Multi-tenant:** Mitigado doblemente:
   - Capa HTTP: `CompanyTenantGuard` rechaza cualquier llamada donde el token no coincida con el `:empresaId` de la URL.
   - Capa de Datos: Repositorios Prisma exigen `empresa_id` en todas las lecturas, actualizaciones y eliminaciones.
3. **Destrucción de Plantillas Globales:** Mitigado explícitamente en `UpdateTemplateUseCase` y `DeleteTemplateUseCase` lanzando `ForbiddenException` si `template.empresaId === null`.
4. **Regla TypeScript `isolatedModules`:** Todo uso de interfaces o tipos en constructores decorados usará estrictamente `import type`.
5. **Compilación Limpia:** Ejecución de `npm run build` exigiendo 0 errores.
