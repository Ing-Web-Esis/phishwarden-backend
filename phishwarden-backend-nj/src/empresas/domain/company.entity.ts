export class CompanyEntity {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly accessCode: string,
    public readonly createdAt?: Date,
  ) {}

  /**
   * Genera un código de acceso único de 8 caracteres alfanuméricos en mayúsculas.
   * Ejemplo: PW9X2A81
   */
  static generateAccessCode(prefix: string = 'PW'): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluye caracteres ambiguos (0, O, 1, I)
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}${randomPart}`;
  }
}