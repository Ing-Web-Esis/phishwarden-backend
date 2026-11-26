export type RiskLevel = 'bajo' | 'medio' | 'critico';

export interface RiskDistribution {
  bajo: number;
  medio: number;
  critico: number;
}

export class RiskPostureEntity {
  constructor(
    public readonly scoreRiesgoPromedio: number,
    public readonly nivelRiesgoGlobal: RiskLevel,
    public readonly distribucion: RiskDistribution,
  ) {}
}

export class MobileAdoptionEntity {
  constructor(
    public readonly totalColaboradores: number,
    public readonly colaboradoresVinculados: number,
    public readonly tasaAdopcion: number,
  ) {}
}

export class SimulationMetricsEntity {
  constructor(
    public readonly totalCampanas: number,
    public readonly totalEnvios: number,
    public readonly totalAperturas: number,
    public readonly totalClics: number,
    public readonly totalEnviosCredenciales: number,
    public readonly totalReportes: number,
    public readonly tasaApertura: number,
    public readonly tasaClic: number,
    public readonly tasaCompromisoCredenciales: number,
    public readonly tasaReporteTemprano: number,
  ) {}
}

export class TrainingMetricsEntity {
  constructor(
    public readonly totalLeccionesCompletadas: number,
    public readonly totalLeccionesPendientes: number,
    public readonly totalLeccionesReprobadas: number,
    public readonly tasaAprobacion: number,
  ) {}
}

export class ExecutiveSummaryEntity {
  constructor(
    public readonly posturaRiesgo: RiskPostureEntity,
    public readonly adopcionMovil: MobileAdoptionEntity,
    public readonly metricasSimulaciones: SimulationMetricsEntity,
    public readonly metricasCapacitacion: TrainingMetricsEntity,
  ) {}
}
