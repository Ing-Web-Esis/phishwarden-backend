export interface CampaignTemplateDetail {
  id: number;
  titulo: string;
  metodoAtaque: string;
  asunto: string | null;
  cuerpoHtml: string;
  indicadorDificultad: string | null;
}

export interface CampaignDetailResult {
  id: string;
  templateId: number | null;
  name: string;
  scheduledDate: Date;
  shippingMethod: string;
  status: string;
  createdAt: Date | null;
  template: CampaignTemplateDetail | null;
  totalParticipants: number;
}
