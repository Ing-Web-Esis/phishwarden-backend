import { Injectable, Inject } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type {
  MobileRepositoryPort,
  CreateReportInput,
  ReportCreatedResult,
} from './mobile.repository.port';

export interface ReportSuspiciousMessageResult extends ReportCreatedResult {
  message: string;
}

@Injectable()
export class ReportSuspiciousMessageUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(
    usuarioId: string,
    input: CreateReportInput,
  ): Promise<ReportSuspiciousMessageResult> {
    const result = await this.mobileRepository.createReportAndUpdateRisk(usuarioId, {
      canal: input.canal,
      remitente: input.remitente.trim(),
      asunto: input.asunto?.trim(),
      descripcion: input.descripcion?.trim(),
      urlSospechosa: input.urlSospechosa?.trim(),
    });

    return {
      message: 'Reporte registrado exitosamente. Tu score de riesgo ha disminuido.',
      reporteId: result.reporteId,
      scoreRiesgo: result.scoreRiesgo,
      rachaDiasSeguros: result.rachaDiasSeguros,
      puntosDisminuidos: result.puntosDisminuidos,
    };
  }
}
