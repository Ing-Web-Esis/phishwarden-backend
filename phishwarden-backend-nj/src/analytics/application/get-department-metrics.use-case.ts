import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_PORT } from './analytics.repository.port';
import type { AnalyticsRepositoryPort } from './analytics.repository.port';
import type { AnalyticsDateRangeDto } from '../infrastructure/analytics-date-range.dto';
import type { DepartmentMetricEntity } from '../domain/department-metrics.entity';
import { parseAnalyticsDateRange } from './date-range.helper';

@Injectable()
export class GetDepartmentMetricsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_PORT)
    private readonly analyticsRepo: AnalyticsRepositoryPort,
  ) {}

  async execute(
    empresaId: number,
    query?: AnalyticsDateRangeDto,
  ): Promise<DepartmentMetricEntity[]> {
    const dateRange = parseAnalyticsDateRange(query);
    return this.analyticsRepo.getDepartmentMetrics(empresaId, dateRange);
  }
}
