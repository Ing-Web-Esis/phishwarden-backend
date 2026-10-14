import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';

@Injectable()
export class CancelCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(id: string) {
    const existing = await this.campaignRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('La campaña no fue encontrada.');
    }

    await this.campaignRepository.cancel(id);

    return {
      message: 'Campaña cancelada exitosamente.',
      campaignId: id,
    };
  }
}