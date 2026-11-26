import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_PORT } from './analytics.repository.port';
import type { AnalyticsRepositoryPort } from './analytics.repository.port';
import type { AnalyticsDateRangeDto } from '../infrastructure/analytics-date-range.dto';
import { parseAnalyticsDateRange } from './date-range.helper';
import { generateCsv } from '../infrastructure/csv-sanitizer.helper';

@Injectable()
export class ExportAnalyticsCsvUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_PORT)
    private readonly analyticsRepo: AnalyticsRepositoryPort,
  ) {}

  async execute(
    empresaId: number,
    query?: AnalyticsDateRangeDto,
  ): Promise<string> {
    const dateRange = parseAnalyticsDateRange(query);
    const data = await this.analyticsRepo.getExportData(empresaId, dateRange);

    const headers = [
      'ID Colaborador',
      'Nombre',
      'Correo Electrónico',
      'Departamento',
      'Score de Riesgo',
      'Nivel de Riesgo',
      'Simulaciones Recibidas',
      'Clics en Enlace',
      'Credenciales Comprometidas',
      'Reportes Sospechosos',
      'Lecciones Completadas',
      'Puntos Acumulados',
      'Estado App Móvil',
    ];

    const rows = data.map((r) => [
      r.usuarioId,
      r.nombre,
      r.correo,
      r.departamento,
      r.scoreRiesgo,
      r.nivelRiesgo,
      r.simulacionesRecibidas,
      r.clicsEnlace,
      r.credencialesComprometidas,
      r.reportesSospechosos,
      r.leccionesCompletadas,
      r.puntosAcumulados,
      r.estadoAppMovil,
    ]);

    return generateCsv(headers, rows);
  }
}
