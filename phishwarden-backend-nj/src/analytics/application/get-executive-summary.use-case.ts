import { Injectable, Inject } from '@nestjs/common';
import { ANALYTICS_REPOSITORY_PORT } from './analytics.repository.port';
import type { AnalyticsRepositoryPort } from './analytics.repository.port';
import type { AnalyticsDateRangeDto } from '../infrastructure/analytics-date-range.dto';
import type { ExecutiveSummaryEntity } from '../domain/executive-summary.entity';
import { parseAnalyticsDateRange } from './date-range.helper';

@Injectable()
export class GetExecutiveSummaryUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_PORT)
    private readonly analyticsRepo: AnalyticsRepositoryPort,
  ) {}

  async execute(
    empresaId: number,
    query?: AnalyticsDateRangeDto,
  ): Promise<ExecutiveSummaryEntity> {
    const dateRange = parseAnalyticsDateRange(query);
    return this.analyticsRepo.getExecutiveSummary(empresaId, dateRange);
  }
}
