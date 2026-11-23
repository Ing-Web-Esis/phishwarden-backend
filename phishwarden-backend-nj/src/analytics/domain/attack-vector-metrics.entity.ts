export class AttackVectorMetricEntity {
  constructor(
    public readonly metodoAtaque: string,
    public readonly totalEnvios: number,
    public readonly totalClics: number,
    public readonly totalEnviosCredenciales: number,
    public readonly tasaClic: number,
    public readonly tasaCompromiso: number,
  ) {}
}
