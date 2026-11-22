# Plan de Implementación — Fase 3: M3 Backend para App Móvil (Vinculación, Push FCM y Reporte)

## 1. Resumen Ejecutivo y Alcance

Este plan detalla la arquitectura técnica e implementación para el módulo móvil (**Fase 3: M3**) en `phishwarden-backend-nj/`. Siguiendo estrictamente las especificaciones de `specs/fase-3-fcm-movil/spec.md` y la `CONSTITUTION.md`:

- **Incluido en Fase 3:**
  1. Corrección del valor por defecto de `score_riesgo` inicial a `0` (en base de datos, Prisma, creación manual y carga masiva CSV).
  2. Endpoint de vinculación móvil `POST /mobile/auth/vincular` con emisión de JWT (`role: 'EMPLOYEE'`).
  3. Blindaje de roles: `CompanyTenantGuard` rechaza tokens de empleado en rutas administrativas (`403 Forbidden`) y `EmployeeJwtGuard` protege las rutas `/mobile/*`.
  4. Exposición de `codigoAcceso` (`empresas.codigo_acceso`) en `GET /auth/me` y `GET /empresas/:empresaId` para el administrador web.
  5. Módulo hexagonal `src/mobile/` para gestionar perfil (`GET /mobile/perfil`), token push (`PUT /mobile/push-token`, `DELETE /mobile/push-token`) y reporte de phishing (`POST /mobile/reportes`) con reducción de riesgo e incremento de racha segura.
  6. Servicio `FcmPushService` con soporte dual `FCM_MODE=sandbox|live` e integración no bloqueante en `TrackClickUseCase` y `TrackSubmitUseCase` (alertas push de Fase 2).
- **Excluido estrictamente (Fase 4, 5 y Frontend):**
  - No se incluyen microlecciones, evaluaciones, medallas ni insignias (M4).
  - No se modifica el frontend web (`phishwarden-web-tl/`) ni la app Flutter.

---

## 2. Ajuste de `score_riesgo` Inicial a `0`

### 2.1 Coherencia de Negocio
En PhishWarden, un mayor `score_riesgo` denota mayor vulnerabilidad ante ciberataques:
- **`0` puntos:** Estado óptimo / colaborador seguro (valor inicial para nuevos usuarios).
- **Caer en simulación (Fase 2):** Suma `+15` puntos al hacer clic y `+30` puntos al enviar formulario (máximo `100`).
- **Reportar phishing real (Fase 3):** Reduce `-5` puntos (mínimo `0`) y suma `+1` a la racha de días seguros.

### 2.2 Migración de Base de Datos y Prisma
1. **Esquema Prisma (`prisma/schema.prisma`):**
   ```prisma
   model usuarios {
     id                      String               @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
     ...
     score_riesgo            Int?                 @default(0)
     racha_dias_seguros      Int?                 @default(0)
     ...
   }
   ```
2. **Sentencias SQL a ejecutar contra la base de datos (Supabase PostgreSQL):**
   ```sql
   -- 1. Modificar el valor por defecto de la columna en PostgreSQL
   ALTER TABLE usuarios ALTER COLUMN score_riesgo SET DEFAULT 0;

   -- 2. Restablecer a 0 a los usuarios existentes con score_riesgo = 100 que no tengan eventos de fallo registrados
   UPDATE usuarios 
   SET score_riesgo = 0 
   WHERE (score_riesgo = 100 OR score_riesgo IS NULL)
     AND id NOT IN (
       SELECT DISTINCT usuario_id 
       FROM eventos_simulacion 
       WHERE usuario_id IS NOT NULL 
         AND tipo_evento IN ('click', 'formulario_enviado')
     );

   -- 3. Crear tabla de reportes sospechosos para persistencia y auditoría de la app móvil
   CREATE TABLE IF NOT EXISTS reportes_sospechosos (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
       canal VARCHAR(20) NOT NULL CHECK (canal IN ('email', 'sms', 'otro')),
       remitente VARCHAR(150) NOT NULL,
       asunto VARCHAR(200),
       descripcion TEXT,
       url_sospechosa VARCHAR(500),
       fecha_reporte TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX IF NOT EXISTS idx_reportes_usuario_id ON reportes_sospechosos(usuario_id);
   ```
3. **Actualización de `phishwarden-backend/phishwarden.sql`:**
   - Modificar la definición de `usuarios.score_riesgo`:
     ```sql
     score_riesgo INT DEFAULT 0 CHECK (score_riesgo BETWEEN 0 AND 100),
     ```
   - Añadir la definición de `reportes_sospechosos`.
4. **Casos de uso de creación e importación (`src/empleados/`):**
   - En `PrismaEmployeeRepository.createEmployee`: fijar explícitamente `score_riesgo: 0` y `racha_dias_seguros: 0`.
   - En `PrismaEmployeeRepository.bulkCreateEmployees`: fijar explícitamente `score_riesgo: 0` y `racha_dias_seguros: 0` en el mapeo de registros.
   - En `PrismaEmployeeRepository.findSummaryByCompany`: actualizar fallback a `u.score_riesgo ?? 0`.
   - En `RiskScoreCalculator.calculate`: actualizar fallback a `const safeScore = currentScore ?? 0;`.

---

## 3. Vinculación Móvil, Autenticación y Aislamiento de Roles

### 3.1 Flujo de Vinculación (`POST /mobile/auth/vincular`)
1. **Entrada:** `{ correoCorporativo: string, codigoAcceso: string }`
   - Validación: Correo electrónico normalizado en minúsculas y código de acceso alfanumérico en mayúsculas (`PW...`).
2. **Lógica de negocio:**
   - Consulta `empresas` por `codigo_acceso === codigoAcceso`. Si no existe, lanza `UnauthorizedException('Código de acceso de organización inválido o inexistente')`.
   - Consulta `usuarios` por `correo_corporativo === correoCorporativo`, `empresa_id === empresa.id` y `estado === 'activo'`. Si no existe o no está activo, lanza `UnauthorizedException('El correo corporativo no pertenece a esta organización o no se encuentra activo')`.
3. **Firma de Token JWT de Empleado:**
   - Payload:
     ```typescript
     interface EmployeeJwtPayload {
       sub: string;           // usuario.id (UUIDv4)
       usuarioId: string;     // usuario.id (UUIDv4)
       empresaId: number;     // usuario.empresa_id (INT)
       correo: string;        // usuario.correo_corporativo
       role: 'EMPLOYEE';      // Rol explícito para guardias de seguridad
     }
     ```
   - Vigencia: `30d` (adecuado para sesiones en dispositivos móviles).
4. **Respuesta (200 OK):**
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

### 3.2 Blindaje y Separación de Guards
- **Protección de endpoints administrativos (`/empresas/:empresaId/*`):**
  `CompanyTenantGuard` actualmente contiene:
  ```typescript
  if (user.role !== 'administrador') {
    throw new ForbiddenException('Acceso restringido a administradores web de la organización');
  }
  ```
  Esto garantiza que cualquier token emitido con `role: 'EMPLOYEE'` sea rechazado automáticamente con **403 Forbidden**.
- **Protección de endpoints móviles (`/mobile/*`):**
  Se creará `EmployeeJwtGuard` en `src/mobile/infrastructure/employee-jwt.guard.ts`:
  ```typescript
  @Injectable()
  export class EmployeeJwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const authorization = request.headers.authorization;
      const [scheme, token] = authorization?.split(' ') ?? [];

      if (scheme !== 'Bearer' || !token) {
        throw new UnauthorizedException('Se requiere un token Bearer');
      }

      try {
        const payload = await this.jwtService.verifyAsync<EmployeeJwtPayload>(token);
        if (payload.role !== 'EMPLOYEE' || !payload.usuarioId) {
          throw new ForbiddenException('Acceso restringido a colaboradores móviles');
        }
        request.user = payload;
        return true;
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        throw new UnauthorizedException('Token inválido o expirado');
      }
    }
  }
  ```

### 3.3 Visibilidad de `codigoAcceso` para el Administrador
1. **En `GET /auth/me` (`AuthController`):**
   - Actualizar `PrismaAuthRepository.findAdminProfileById` para incluir `codigoAcceso: admin.empresas.codigo_acceso` dentro de la propiedad `empresa`.
2. **En `GET /empresas/:empresaId` (`EmpresasController`):**
   - Añadir endpoint protegido con `JwtAuthGuard` + `CompanyTenantGuard` que devuelva `{ id, nombre, codigoAcceso, fechaCreacion }`.

---

## 4. Arquitectura Hexagonal del Módulo `src/mobile/`

```
src/mobile/
├── domain/
│   ├── mobile-user.entity.ts              # Entidad pura del colaborador móvil
│   ├── mobile-report.entity.ts            # Entidad pura del reporte sospechoso
│   └── mobile-report-channel.enum.ts      # Enum: 'email' | 'sms' | 'otro'
├── application/
│   ├── vincular-mobile.use-case.ts        # Caso de uso de vinculación
│   ├── get-mobile-profile.use-case.ts     # Perfil del colaborador autenticado
│   ├── update-push-token.use-case.ts      # Registro / actualización de token FCM
│   ├── remove-push-token.use-case.ts      # Desvinculación de token FCM
│   ├── report-suspicious-message.use-case.ts # Reporte de phishing y ajuste de score
│   ├── mobile.repository.port.ts          # Puerto MobileRepositoryPort + TOKEN
│   └── push-notification.port.ts          # Puerto PushNotificationPort + TOKEN
├── infrastructure/
│   ├── employee-jwt.guard.ts              # Guard de autenticación de empleados
│   ├── fcm-push.service.ts                # Implementación de Firebase Admin FCM
│   ├── prisma-mobile.repository.ts        # Adaptador Prisma para persistencia móvil
│   ├── mobile.controller.ts               # Controlador REST /mobile/* con Swagger
│   ├── vincular-mobile.dto.ts             # DTO de vinculación
│   ├── update-push-token.dto.ts           # DTO de token push
│   └── create-mobile-report.dto.ts        # DTO de reporte de mensaje sospechoso
└── mobile.module.ts                       # Conexión de puertos, servicios y controladores
```

### 4.1 Endpoints del Módulo Móvil
| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| `POST` | `/mobile/auth/vincular` | Público | Vincula credenciales corporativas y emite JWT (`role: 'EMPLOYEE'`) |
| `GET` | `/mobile/perfil` | `EmployeeJwtGuard` | Retorna perfil, score de riesgo, racha segura y estado de push |
| `PUT` | `/mobile/push-token` | `EmployeeJwtGuard` | Registra o actualiza el FCM registration token |
| `DELETE` | `/mobile/push-token` | `EmployeeJwtGuard` | Elimina el FCM registration token al cerrar sesión |
| `POST` | `/mobile/reportes` | `EmployeeJwtGuard` | Registra reporte sospechoso, resta `-5` al score e incrementa racha `+1` |

### 4.2 Lógica de Negocio de `POST /mobile/reportes`
```typescript
async execute(usuarioId: string, input: CreateMobileReportInput) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Obtener usuario actual
    const user = await tx.usuarios.findUnique({ where: { id: usuarioId } });
    if (!user) throw new NotFoundException('Colaborador no encontrado');

    // 2. Calcular nuevo score (piso en 0) y nueva racha (+1)
    const currentScore = user.score_riesgo ?? 0;
    const currentStreak = user.racha_dias_seguros ?? 0;
    const newScore = Math.max(0, currentScore - 5);
    const newStreak = currentStreak + 1;

    // 3. Registrar reporte en tabla dedicada
    const reporte = await tx.reportes_sospechosos.create({
      data: {
        usuario_id: usuarioId,
        canal: input.canal,
        remitente: input.remitente,
        asunto: input.asunto,
        descripcion: input.descripcion,
        url_sospechosa: input.urlSospechosa,
      },
    });

    // 4. Actualizar usuario
    await tx.usuarios.update({
      where: { id: usuarioId },
      data: {
        score_riesgo: newScore,
        racha_dias_seguros: newStreak,
      },
    });

    return {
      message: 'Reporte registrado exitosamente. Tu score de riesgo ha disminuido.',
      reporteId: reporte.id,
      scoreRiesgo: newScore,
      rachaDiasSeguros: newStreak,
      puntosDisminuidos: currentScore - newScore,
    };
  });
}
```

---

## 5. Diseño de `FcmPushService` y Alertas Automáticas (Fase 2 + Fase 3)

### 5.1 Configuración y Modos (`FCM_MODE=sandbox|live`)
- **Dependencia:** `firebase-admin` instalado en `dependencies`.
- **Variables de entorno:**
  - `FCM_MODE`: `'sandbox'` (por defecto en local y test) o `'live'`.
  - `FIREBASE_PROJECT_ID`: ID del proyecto de Firebase.
  - `FIREBASE_CLIENT_EMAIL`: Correo de la cuenta de servicio de Firebase.
  - `FIREBASE_PRIVATE_KEY`: Llave privada RSA (soporta saltos de línea con escape `\n`).

### 5.2 Implementación de `FcmPushService`
- **Inicialización:**
  - Si `FCM_MODE === 'live'` y existen credenciales válidas, inicializa `admin.initializeApp({ credential: admin.credential.cert(...) })`.
  - Si `FCM_MODE === 'sandbox'` o faltan credenciales, opera en modo simulación sin arrojar excepciones de inicio.
- **Envío en Sandbox:**
  - Emite un log estructurado con `Logger.log`:
    ```
    [FCM_SANDBOX] Push Notification Simulated -> Token: <token_prefijo>... | Title: <title> | Body: <body> | Data: <json_data>
    ```
  - Retorna `true`.
- **Envío en Live:**
  - Ejecuta `await admin.messaging().send({ token, notification: { title, body }, data })`.
  - Si Firebase retorna error de token inválido (`messaging/invalid-registration-token` o `messaging/registration-token-not-registered`), automáticamente ejecuta un callback para limpiar `usuarios.token_notificacion_push = null` en la base de datos.
  - Atrapa cualquier error de red sin propagar excepciones no deseadas a los casos de uso.

### 5.3 Integración No Bloqueante en `TrackClickUseCase` y `TrackSubmitUseCase`
1. **Extensión de `TrackingParticipantDetail`:**
   En `src/simulaciones/application/simulation-tracking.repository.port.ts`:
   - Añadir `usuarioPushToken?: string | null;`
   - En `PrismaSimulationTrackingRepository.findParticipantByToken`: incluir `token_notificacion_push` en el `select` de `usuarios`.
2. **Disparo en `TrackClickUseCase`:**
   Cuando se registra un nuevo evento `CLICK` y `participant.usuarioPushToken` no es nulo:
   - Se invoca de forma asíncrona no bloqueante (sin bloquear el `HTTP 302 Found` de redirección al portal):
     - **Título:** `⚠️ Alerta de Seguridad: Clic en enlace sospechoso`
     - **Cuerpo:** `Hola ${participant.usuarioNombre}, detectamos que hiciste clic en un enlace de simulación. Revisa la aplicación móvil para más detalles.`
     - **Data Payload Flutter:**
       ```json
       {
         "tipoAlerta": "SIMULATION_CLICK",
         "campanaId": "UUID",
         "metodoAtaque": "phishing",
         "fechaHora": "2026-11-21T18:30:00.000Z",
         "clickAction": "FLUTTER_NOTIFICATION_CLICK"
       }
       ```
3. **Disparo en `TrackSubmitUseCase`:**
   Cuando se registra un nuevo evento `FORMULARIO_ENVIADO` y `participant.usuarioPushToken` no es nulo:
   - Se invoca de forma asíncrona no bloqueante (sin bloquear la respuesta `200 OK` de feedback educativo):
     - **Título:** `🚨 Alerta Crítica: Credenciales enviadas en simulación`
     - **Cuerpo:** `Hola ${participant.usuarioNombre}, ingresaste información en un portal simulado. Tu score de riesgo ha aumentado.`
     - **Data Payload Flutter:**
       ```json
       {
         "tipoAlerta": "SIMULATION_SUBMIT",
         "campanaId": "UUID",
         "metodoAtaque": "phishing",
         "fechaHora": "2026-11-21T18:30:00.000Z",
         "clickAction": "FLUTTER_NOTIFICATION_CLICK"
       }
       ```

---

## 6. Verificación y Criterios de Aceptación
1. **0 Errores de compilación:** `npm run build` en `phishwarden-backend-nj/` compila limpiamente.
2. **Documentación Swagger:** Todos los endpoints `/mobile/*` y `GET /empresas/:empresaId` cuentan con esquemas, DTOs y anotaciones `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`.
3. **Contratos:** `specs/API_CONTRACTS.md` actualizado con la nueva sección `Móvil (Fase 3 - M3)`.
4. **Configuración:** `.env.example` actualizado con variables `FCM_MODE`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
5. **Aislamiento absoluto:** Cero modificaciones fuera de `phishwarden-backend-nj/` y `phishwarden.sql`.
