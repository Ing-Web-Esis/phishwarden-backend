import { MobileReportChannel } from './mobile-report-channel.enum';

export class MobileReportEntity {
  constructor(
    public readonly id: string,
    public readonly usuarioId: string,
    public readonly canal: MobileReportChannel,
    public readonly remitente: string,
    public readonly asunto: string | null,
    public readonly descripcion: string | null,
    public readonly urlSospechosa: string | null,
    public readonly fechaReporte: Date,
  ) {}
}
