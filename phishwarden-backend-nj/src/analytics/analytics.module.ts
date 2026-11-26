import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ANALYTICS_REPOSITORY_PORT } from './application/analytics.repository.port';
import { PrismaAnalyticsRepository } from './infrastructure/prisma-analytics.repository';
import { AnalyticsController } from './infrastructure/analytics.controller';
import { GetExecutiveSummaryUseCase } from './application/get-executive-summary.use-case';
import { GetDepartmentMetricsUseCase } from './application/get-department-metrics.use-case';
import { GetAttackVectorMetricsUseCase } from './application/get-attack-vector-metrics.use-case';
import { GetEvolutionMetricsUseCase } from './application/get-evolution-metrics.use-case';
import { GetFeaturedUsersUseCase } from './application/get-featured-users.use-case';
import { ExportAnalyticsCsvUseCase } from './application/export-analytics-csv.use-case';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [
    {
      provide: ANALYTICS_REPOSITORY_PORT,
      useClass: PrismaAnalyticsRepository,
    },
    GetExecutiveSummaryUseCase,
    GetDepartmentMetricsUseCase,
    GetAttackVectorMetricsUseCase,
    GetEvolutionMetricsUseCase,
    GetFeaturedUsersUseCase,
    ExportAnalyticsCsvUseCase,
  ],
  exports: [
    GetExecutiveSummaryUseCase,
    GetDepartmentMetricsUseCase,
    GetAttackVectorMetricsUseCase,
    GetEvolutionMetricsUseCase,
    GetFeaturedUsersUseCase,
    ExportAnalyticsCsvUseCase,
  ],
})
export class AnalyticsModule {}
