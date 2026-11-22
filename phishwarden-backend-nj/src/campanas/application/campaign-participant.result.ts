export interface CampaignParticipantItem {
  usuarioId: string;
  nombre: string;
  correo: string;
  departamento: string | null;
  estado: string;
}

export interface PaginatedParticipantsResult {
  data: CampaignParticipantItem[];
  total: number;
  page: number;
  limit: number;
}
