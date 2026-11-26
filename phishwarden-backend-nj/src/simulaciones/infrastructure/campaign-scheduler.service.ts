import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessScheduledCampaignsUseCase } from '../application/process-scheduled-campaigns.use-case';

@Injectable()
export class CampaignSchedulerService {
  private readonly logger = new Logger(CampaignSchedulerService.name);

  constructor(
    private readonly processScheduledCampaignsUseCase: ProcessScheduledCampaignsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      await this.processScheduledCampaignsUseCase.execute();
    } catch (error) {
      this.logger.error('Error al ejecutar el scheduler de campañas programadas:', error);
    }
  }
}
