export class MobileUserEntity {
  constructor(
    public readonly id: string,
    public readonly empresaId: number,
    public readonly nombre: string,
    public readonly correoCorporativo: string,
    public readonly numeroTelefonico: string | null,
    public readonly scoreRiesgo: number,
    public readonly rachaDiasSeguros: number,
    public readonly tokenNotificacionPush: string | null,
    public readonly estado: string,
    public readonly departamentoNombre?: string | null,
    public readonly empresaNombre?: string,
  ) {}

  get pushHabilitado(): boolean {
    return Boolean(this.tokenNotificacionPush && this.tokenNotificacionPush.trim().length > 0);
  }
}
