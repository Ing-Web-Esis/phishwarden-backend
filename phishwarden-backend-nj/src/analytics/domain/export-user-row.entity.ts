import type { RiskLevel } from './executive-summary.entity';

export class ExportUserRowEntity {
  constructor(
    public readonly usuarioId: string,
    public readonly nombre: string,
    public readonly correo: string,
    public readonly departamento: string,
    public readonly scoreRiesgo: number,
    public readonly nivelRiesgo: RiskLevel,
    public readonly simulacionesRecibidas: number,
    public readonly clicsEnlace: number,
    public readonly credencialesComprometidas: number,
    public readonly reportesSospechosos: number,
    public readonly leccionesCompletadas: number,
    public readonly puntosAcumulados: number,
    public readonly estadoAppMovil: 'Vinculado' | 'No vinculado',
  ) {}
}
