export enum CampaignStatus {
  PROGRAMADA = 'programada',
  EN_CURSO = 'en_curso',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

export enum ShippingMethod {
  MASIVO = 'masivo',
  ESCALONADO = 'escalonado',
}

export interface CampaignTemplateSummary {
  id: number;
  titulo: string;
  metodoAtaque: string;
}

export class CampaignEntity {
  constructor(
    public readonly id: string, // UUID
    public readonly templateId: number, // INT (plantillas.id)
    public readonly name: string,
    public readonly scheduledDate: Date,
    public readonly shippingMethod: ShippingMethod,
    public readonly status: CampaignStatus,
    public readonly createdAt?: Date,
    public readonly targetUserIds?: string[], // UUIDs de la tabla usuarios
    public readonly template?: CampaignTemplateSummary,
    public readonly totalParticipants?: number,
  ) {}

  isEditable(): boolean {
    return this.status === CampaignStatus.PROGRAMADA;
  }

  isCancelable(): boolean {
    return (
      this.status === CampaignStatus.PROGRAMADA ||
      this.status === CampaignStatus.EN_CURSO
    );
  }

  canModifyParticipants(): boolean {
    return this.status === CampaignStatus.PROGRAMADA;
  }
}
