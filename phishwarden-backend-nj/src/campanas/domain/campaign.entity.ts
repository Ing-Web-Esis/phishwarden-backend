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
  ) {}
}