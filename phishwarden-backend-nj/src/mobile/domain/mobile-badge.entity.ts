export class MobileBadgeEntity {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly descripcion: string | null,
    public readonly iconoUrl: string | null,
    public readonly puntosRequeridos: number,
    public readonly desbloqueada: boolean,
    public readonly fechaObtencion: Date | null,
  ) {}
}
