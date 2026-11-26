import type { ExecutiveSummaryEntity } from '../domain/executive-summary.entity';
import type { DepartmentMetricEntity } from '../domain/department-metrics.entity';
import type { AttackVectorMetricEntity } from '../domain/attack-vector-metrics.entity';
import type { EvolutionMetricEntity } from '../domain/evolution-metrics.entity';
import type { FeaturedUsersEntity } from '../domain/featured-users.entity';
import type { ExportUserRowEntity } from '../domain/export-user-row.entity';

export const ANALYTICS_REPOSITORY_PORT = Symbol('ANALYTICS_REPOSITORY_PORT');

export interface ParsedDateRange {
  desde?: Date;
  hasta?: Date;
}

export interface AnalyticsRepositoryPort {
  getExecutiveSummary(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<ExecutiveSummaryEntity>;

  getDepartmentMetrics(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<DepartmentMetricEntity[]>;

  getAttackVectorMetrics(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<AttackVectorMetricEntity[]>;

  getEvolutionMetrics(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<EvolutionMetricEntity[]>;

  getFeaturedUsers(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<FeaturedUsersEntity>;

  getExportData(
    empresaId: number,
    dateRange?: ParsedDateRange,
  ): Promise<ExportUserRowEntity[]>;
}
