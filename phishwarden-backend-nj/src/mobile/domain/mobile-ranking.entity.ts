export class MobileRankingItemEntity {
  constructor(
    public readonly posicion: number,
    public readonly usuarioId: string,
    public readonly nombre: string,
    public readonly departamento: string | null,
    public readonly puntosTotales: number,
    public readonly medallasCount: number,
    public readonly rachaDiasSeguros: number,
    public readonly scoreRiesgo: number,
    public readonly esUsuarioActual: boolean,
  ) {}
}

export interface UnlockedBadgeInfo {
  id: number;
  nombre: string;
  descripcion: string | null;
  iconoUrl: string | null;
  puntosRequeridos: number;
}

export class EvaluationResultEntity {
  constructor(
    public readonly aprobado: boolean,
    public readonly porcentajeAciertos: number,
    public readonly correctas: number,
    public readonly totalPreguntas: number,
    public readonly puntosGanados: number,
    public readonly puntosTotales: number,
    public readonly scoreRiesgoActualizado: number,
    public readonly nuevasMedallasDesbloqueadas: UnlockedBadgeInfo[],
  ) {}
}
