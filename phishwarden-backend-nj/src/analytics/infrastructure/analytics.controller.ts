import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

// Regla técnica 4: Import normal para clases concretas de casos de uso para emitDecoratorMetadata
import { GetExecutiveSummaryUseCase } from '../application/get-executive-summary.use-case';
import { GetDepartmentMetricsUseCase } from '../application/get-department-metrics.use-case';
import { GetAttackVectorMetricsUseCase } from '../application/get-attack-vector-metrics.use-case';
import { GetEvolutionMetricsUseCase } from '../application/get-evolution-metrics.use-case';
import { GetFeaturedUsersUseCase } from '../application/get-featured-users.use-case';
import { ExportAnalyticsCsvUseCase } from '../application/export-analytics-csv.use-case';
import { AnalyticsDateRangeDto } from './analytics-date-range.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@Controller('empresas/:empresaId/analytics')
export class AnalyticsController {
  constructor(
    private readonly getExecutiveSummaryUseCase: GetExecutiveSummaryUseCase,
    private readonly getDepartmentMetricsUseCase: GetDepartmentMetricsUseCase,
    private readonly getAttackVectorMetricsUseCase: GetAttackVectorMetricsUseCase,
    private readonly getEvolutionMetricsUseCase: GetEvolutionMetricsUseCase,
    private readonly getFeaturedUsersUseCase: GetFeaturedUsersUseCase,
    private readonly exportAnalyticsCsvUseCase: ExportAnalyticsCsvUseCase,
  ) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'Obtener resumen ejecutivo y postura global de riesgo',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Resumen ejecutivo con postura de riesgo, adopción móvil, simulaciones y capacitación.',
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra empresa.' })
  async getSummary(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: AnalyticsDateRangeDto,
  ) {
    return this.getExecutiveSummaryUseCase.execute(empresaId, query);
  }

  @Get('departamentos')
  @ApiOperation({
    summary: 'Obtener desglose comparativo de riesgo por departamento',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Lista de departamentos ordenados por score de riesgo promedio descendente.',
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra empresa.' })
  async getDepartments(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: AnalyticsDateRangeDto,
  ) {
    return this.getDepartmentMetricsUseCase.execute(empresaId, query);
  }

  @Get('vectores')
  @ApiOperation({
    summary: 'Obtener efectividad y susceptibilidad por vector de ataque',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Métricas de los 4 vectores (phishing, smishing, vishing, ingenieria_social).',
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra empresa.' })
  async getVectors(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: AnalyticsDateRangeDto,
  ) {
    return this.getAttackVectorMetricsUseCase.execute(empresaId, query);
  }

  @Get('evolucion')
  @ApiOperation({
    summary: 'Obtener serie temporal de evolución mensual de incidentes y capacitación',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Serie temporal con periodos YYYY-MM y métricas mensuales.',
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra empresa.' })
  async getEvolution(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: AnalyticsDateRangeDto,
  ) {
    return this.getEvolutionMetricsUseCase.execute(empresaId, query);
  }

  @Get('usuarios-destacados')
  @ApiOperation({
    summary: 'Obtener Top 5 de colaboradores en mayor riesgo y mejores defensores',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Listas Top 5 de mayorRiesgo y mejoresDefensores.',
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra empresa.' })
  async getFeaturedUsers(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: AnalyticsDateRangeDto,
  ) {
    return this.getFeaturedUsersUseCase.execute(empresaId, query);
  }

  @Get('exportar')
  @ApiOperation({
    summary: 'Exportar reporte ejecutivo consolidado en formato CSV',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({
    status: 200,
    description: 'Archivo CSV descargable con cabeceras HTTP y protección anti-inyección.',
  })
  @ApiResponse({ status: 400, description: 'Rango de fechas inválido.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra empresa.' })
  async exportCsv(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: AnalyticsDateRangeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte-phishwarden-empresa-${empresaId}.csv"`,
    });
    return this.exportAnalyticsCsvUseCase.execute(empresaId, query);
  }
}
