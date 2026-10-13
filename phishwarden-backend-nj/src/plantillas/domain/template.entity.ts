export enum AttackType {
  LINK_CLICK = 'LINK_CLICK',
  CREDENTIAL_HARVEST = 'CREDENTIAL_HARVEST',
  MALICIOUS_ATTACHMENT = 'MALICIOUS_ATTACHMENT',
  SMISHING = 'SMISHING',
}

export enum DifficultyLevel {
  BAJO = 'BAJO',
  MEDIO = 'MEDIO',
  ALTO = 'ALTO',
}

export class TemplateEntity {
  constructor(
    public readonly id: string,
    public readonly companyId: number | null,
    public readonly title: string,
    public readonly subject: string,
    public readonly bodyHtml: string,
    public readonly attackType: AttackType,
    public readonly difficulty: DifficultyLevel,
    public readonly isGlobal: boolean,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}