export class EvolutionMetricEntity {
  constructor(
    public readonly periodo: string, // 'YYYY-MM'
    public readonly simulacionesEnviadas: number,
    public readonly incidentesSimulacion: number,
    public readonly reportesSospechosos: number,
    public readonly leccionesCompletadas: number,
  ) {}
}
