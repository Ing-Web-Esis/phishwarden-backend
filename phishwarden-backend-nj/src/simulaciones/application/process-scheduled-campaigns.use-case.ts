import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SIMULATION_TRACKING_REPOSITORY_PORT,
} from './simulation-tracking.repository.port';
import type {
  SimulationTrackingRepositoryPort,
} from './simulation-tracking.repository.port';
import { DispatchCampaignUseCase } from './dispatch-campaign.use-case';

@Injectable()
export class ProcessScheduledCampaignsUseCase {
  private readonly logger = new Logger(ProcessScheduledCampaignsUseCase.name);

  constructor(
    @Inject(SIMULATION_TRACKING_REPOSITORY_PORT)
    private readonly trackingRepository: SimulationTrackingRepositoryPort,
    private readonly dispatchCampaignUseCase: DispatchCampaignUseCase,
  ) {}

  async execute() {
    const now = new Date();

    // 1. Cierre automático de campañas en curso por vencimiento
    const durationHours = Number(process.env.CAMPAIGN_DURATION_HOURS) || 72;
    const cutoffDate = new Date(now.getTime() - durationHours * 60 * 60 * 1000);
    const finalizedCount =
      await this.trackingRepository.finalizeExpiredInCourseCampaigns(cutoffDate);

    if (finalizedCount > 0) {
      this.logger.log(
        `Se finalizaron automáticamente ${finalizedCount} campaña(s) en curso por superar el límite de ${durationHours}h.`,
      );
    }

    // 2. Procesamiento de campañas programadas pendientes de despacho
    const pendingIds =
      await this.trackingRepository.findPendingScheduledCampaignIds(now);

    if (pendingIds.length === 0) {
      return { processed: 0, autoFinalized: finalizedCount };
    }

    this.logger.log(
      `Procesando ${pendingIds.length} campaña(s) programada(s) pendiente(s) de despacho.`,
    );

    let processedCount = 0;
    for (const campaignId of pendingIds) {
      try {
        const result = await this.dispatchCampaignUseCase.execute(campaignId);
        if (result) {
          processedCount++;
        }
      } catch (err) {
        this.logger.error(
          `Error al procesar despacho programado para campaña ${campaignId}:`,
          err,
        );
      }
    }

    return {
      processed: processedCount,
      totalFound: pendingIds.length,
      autoFinalized: finalizedCount,
    };
  }
}
