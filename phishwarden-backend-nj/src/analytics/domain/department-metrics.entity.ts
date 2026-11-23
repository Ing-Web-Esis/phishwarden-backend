import type { RiskLevel } from './executive-summary.entity';

export class DepartmentMetricEntity {
  constructor(
    public readonly departamentoId: number | null,
    public readonly departamento: string,
    public readonly totalColaboradores: number,
    public readonly scoreRiesgoPromedio: number,
    public readonly nivelRiesgo: RiskLevel,
    public readonly simulacionesRecibidas: number,
    public readonly clicsEnSimulacion: number,
    public readonly credencialesComprometidas: number,
    public readonly tasaVulnerabilidad: number,
    public readonly reportesRealizados: number,
    public readonly leccionesCompletadas: number,
  ) {}
}
