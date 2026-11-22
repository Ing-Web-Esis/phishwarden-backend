import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { VincularMobileUseCase } from '../application/vincular-mobile.use-case';
import { GetMobileProfileUseCase } from '../application/get-mobile-profile.use-case';
import { UpdatePushTokenUseCase } from '../application/update-push-token.use-case';
import { RemovePushTokenUseCase } from '../application/remove-push-token.use-case';
import { ReportSuspiciousMessageUseCase } from '../application/report-suspicious-message.use-case';
import { GetMobileLessonsUseCase } from '../application/get-mobile-lessons.use-case';
import { GetMobileLessonDetailUseCase } from '../application/get-mobile-lesson-detail.use-case';
import { EvaluateMobileLessonUseCase } from '../application/evaluate-mobile-lesson.use-case';
import { GetMobileBadgesUseCase } from '../application/get-mobile-badges.use-case';
import { GetMobileRankingUseCase } from '../application/get-mobile-ranking.use-case';
import { EmployeeJwtGuard } from './employee-jwt.guard';
import type { AuthenticatedEmployeeRequest } from './employee-jwt.guard';
import { VincularMobileDto } from './vincular-mobile.dto';
import { UpdatePushTokenDto } from './update-push-token.dto';
import { CreateMobileReportDto } from './create-mobile-report.dto';
import { EvaluateLessonDto } from './evaluate-lesson.dto';

@ApiTags('mobile')
@Controller('mobile')
export class MobileController {
  constructor(
    private readonly vincularMobileUseCase: VincularMobileUseCase,
    private readonly getMobileProfileUseCase: GetMobileProfileUseCase,
    private readonly updatePushTokenUseCase: UpdatePushTokenUseCase,
    private readonly removePushTokenUseCase: RemovePushTokenUseCase,
    private readonly reportSuspiciousMessageUseCase: ReportSuspiciousMessageUseCase,
    private readonly getMobileLessonsUseCase: GetMobileLessonsUseCase,
    private readonly getMobileLessonDetailUseCase: GetMobileLessonDetailUseCase,
    private readonly evaluateMobileLessonUseCase: EvaluateMobileLessonUseCase,
    private readonly getMobileBadgesUseCase: GetMobileBadgesUseCase,
    private readonly getMobileRankingUseCase: GetMobileRankingUseCase,
  ) {}

  @Post('auth/vincular')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vincular aplicación móvil con credenciales corporativas y código de empresa',
    description: 'Valida que el correo pertenezca a la empresa identificada por el código de acceso y emite un JWT con rol EMPLOYEE.',
  })
  @ApiBody({ type: VincularMobileDto })
  @ApiResponse({ status: 200, description: 'Dispositivo vinculado exitosamente con token JWT retornado.' })
  @ApiResponse({ status: 400, description: 'Payload malformado o faltan datos requeridos.' })
  @ApiResponse({ status: 401, description: 'Código de acceso o correo corporativo inválido.' })
  async vincular(@Body() dto: VincularMobileDto) {
    return this.vincularMobileUseCase.execute(dto);
  }

  @Get('perfil')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil y métricas del colaborador móvil autenticado',
    description: 'Retorna nombre, correo, score de riesgo actual, racha de días seguros y estado del token push.',
  })
  @ApiResponse({ status: 200, description: 'Perfil del colaborador autenticado.' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  @ApiResponse({ status: 404, description: 'Colaborador no encontrado.' })
  async getPerfil(@Req() req: AuthenticatedEmployeeRequest) {
    return this.getMobileProfileUseCase.execute(req.user.usuarioId);
  }

  @Put('push-token')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar o actualizar el token FCM de notificación push',
    description: 'Almacena el FCM registration token en el perfil del colaborador para recibir alertas de simulación.',
  })
  @ApiBody({ type: UpdatePushTokenDto })
  @ApiResponse({ status: 200, description: 'Token push registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Token inválido o malformado.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  async updatePushToken(
    @Req() req: AuthenticatedEmployeeRequest,
    @Body() dto: UpdatePushTokenDto,
  ) {
    return this.updatePushTokenUseCase.execute(req.user.usuarioId, dto.token);
  }

  @Delete('push-token')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Eliminar el token FCM al cerrar sesión o desvincular el dispositivo',
    description: 'Limpia el token push para cesar el envío de alertas móviles al dispositivo.',
  })
  @ApiResponse({ status: 200, description: 'Token push desvinculado exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  async removePushToken(@Req() req: AuthenticatedEmployeeRequest) {
    return this.removePushTokenUseCase.execute(req.user.usuarioId);
  }

  @Post('reportes')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reportar mensaje sospechoso (reduce score de riesgo e incrementa racha segura)',
    description: 'Registra un intento real de phishing/smishing, reduciendo el score de riesgo en -5 puntos (piso mínimo en 0) e incrementando la racha de días seguros en +1.',
  })
  @ApiBody({ type: CreateMobileReportDto })
  @ApiResponse({ status: 201, description: 'Reporte registrado exitosamente con nuevo score de riesgo.' })
  @ApiResponse({ status: 400, description: 'Datos de reporte inválidos.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  async reportar(
    @Req() req: AuthenticatedEmployeeRequest,
    @Body() dto: CreateMobileReportDto,
  ) {
    return this.reportSuspiciousMessageUseCase.execute(req.user.usuarioId, dto);
  }

  // --------------------------------------------------------------------------
  // FASE 4: CAPACITACIÓN PREDEFINIDA, EVALUACIONES, MEDALLAS Y RANKING
  // --------------------------------------------------------------------------

  @Get('lecciones')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar microlecciones clasificadas por estado para el colaborador',
    description: 'Devuelve las microlecciones agrupadas en asignadasPendientes (reactivas por simulación), catalogoDisponible (aprendizaje voluntario) y completadas.',
  })
  @ApiResponse({ status: 200, description: 'Microlecciones clasificadas exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  async getLecciones(@Req() req: AuthenticatedEmployeeRequest) {
    return this.getMobileLessonsUseCase.execute(req.user.usuarioId);
  }

  @Get('lecciones/:id')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener detalle de una microlección y sus preguntas de evaluación',
    description: 'Retorna el contenido multimedia y las preguntas de opción múltiple, omitiendo estrictamente la respuesta correcta por seguridad.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador único de la microlección' })
  @ApiResponse({ status: 200, description: 'Detalle de la microlección y preguntas.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  @ApiResponse({ status: 404, description: 'Microlección no encontrada.' })
  async getLeccionDetalle(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedEmployeeRequest,
  ) {
    return this.getMobileLessonDetailUseCase.execute(id, req.user.usuarioId);
  }

  @Post('lecciones/:id/evaluar')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evaluar respuestas de microlección, calificar en servidor, ajustar riesgo y desbloquear medallas',
    description: 'Califica en servidor las respuestas del colaborador (umbral de aprobación >= 70%). Si aprueba por primera vez, reduce -10 puntos de score de riesgo (piso 0) y desbloquea insignias que alcancen el puntaje acumulado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador de la microlección evaluada' })
  @ApiBody({ type: EvaluateLessonDto })
  @ApiResponse({ status: 200, description: 'Resultado de la evaluación con puntaje y medallas obtenidas.' })
  @ApiResponse({ status: 400, description: 'Respuestas malformadas o preguntas no pertenecen a la lección.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  @ApiResponse({ status: 404, description: 'Microlección no encontrada.' })
  async evaluarLeccion(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedEmployeeRequest,
    @Body() dto: EvaluateLessonDto,
  ) {
    return this.evaluateMobileLessonUseCase.execute(
      id,
      req.user.usuarioId,
      dto.respuestas,
    );
  }

  @Get('medallas')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener catálogo de insignias y estado de desbloqueo del colaborador',
    description: 'Devuelve todas las insignias del sistema con su estado de desbloqueo, fecha de obtención y puntos acumulados del colaborador.',
  })
  @ApiResponse({ status: 200, description: 'Catálogo de insignias con estado de desbloqueo.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  async getMedallas(@Req() req: AuthenticatedEmployeeRequest) {
    return this.getMobileBadgesUseCase.execute(req.user.usuarioId);
  }

  @Get('ranking')
  @UseGuards(EmployeeJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener ranking interno de colaboradores de la empresa',
    description: 'Devuelve la tabla de posiciones interna entre colaboradores activos de la misma organización, ordenada por puntos totales, racha segura y menor riesgo.',
  })
  @ApiResponse({ status: 200, description: 'Tabla de clasificación y posición actual del usuario.' })
  @ApiResponse({ status: 401, description: 'Token ausente o expirado.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado (requiere rol EMPLOYEE).' })
  async getRanking(@Req() req: AuthenticatedEmployeeRequest) {
    return this.getMobileRankingUseCase.execute(
      req.user.empresaId,
      req.user.usuarioId,
    );
  }
}
