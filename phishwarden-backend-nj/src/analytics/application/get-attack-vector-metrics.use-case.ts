import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_PORT } from './analytics.repository.port';
import type { AnalyticsRepositoryPort } from './analytics.repository.port';
import type { AnalyticsDateRangeDto } from '../infrastructure/analytics-date-range.dto';
import type { AttackVectorMetricEntity } from '../domain/attack-vector-metrics.entity';
import { parseAnalyticsDateRange } from './date-range.helper';

@Injectable()
export class GetAttackVectorMetricsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_PORT)
    private readonly analyticsRepo: AnalyticsRepositoryPort,
  ) {}

  async execute(
    empresaId: number,
    query?: AnalyticsDateRangeDto,
  ): Promise<AttackVectorMetricEntity[]> {
    const dateRange = parseAnalyticsDateRange(query);
    return this.analyticsRepo.getAttackVectorMetrics(empresaId, dateRange);
  }
}
