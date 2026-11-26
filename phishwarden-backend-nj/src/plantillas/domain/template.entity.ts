export enum AttackType {
  PHISHING = 'PHISHING',
  SMISHING = 'SMISHING',
}

export enum DifficultyLevel {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
}

export enum LandingType {
  MICROSOFT = 'microsoft',
  GOOGLE = 'google',
  CORPORATIVO = 'corporativo',
  BANCARIO = 'bancario',
  GENERICO = 'generico',
  UNJBG = 'unjbg',
  PERSONALIZADO = 'personalizado',
}

export class TemplateEntity {
  constructor(
    public readonly id: number,
    public readonly companyId: number | null,
    public readonly title: string,
    public readonly subject: string,
    public readonly bodyHtml: string,
    public readonly attackType: AttackType,
    public readonly difficulty: DifficultyLevel,
    public readonly isGlobal: boolean,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly landingTipo?: LandingType,
    public readonly landingId?: number | null,
  ) {}
}