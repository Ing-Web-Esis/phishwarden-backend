export type PortalTipoBase =
  | 'unjbg'
  | 'microsoft'
  | 'google'
  | 'bancario'
  | 'corporativo'
  | 'personalizado';

export class PortalEntity {
  constructor(
    public readonly id: number,
    public readonly empresaId: number | null,
    public readonly nombre: string,
    public readonly tipoBase: PortalTipoBase,
    public readonly tituloPortal: string,
    public readonly subtitulo: string | null,
    public readonly logoUrl: string | null,
    public readonly colorPrimario: string,
    public readonly colorFondo: string,
    public readonly labelUsuario: string,
    public readonly labelPassword: string,
    public readonly textoBoton: string,
    public readonly fechaCreacion?: Date,
  ) {}

  public get esGlobal(): boolean {
    return this.empresaId === null;
  }
}
