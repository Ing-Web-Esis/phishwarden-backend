import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';

@Injectable()
export class GetCampaignByIdUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(id: string, companyId: number) {
    const campaign = await this.campaignRepository.findById(id, companyId);

    if (!campaign) {
      throw new NotFoundException('La campaña no existe o no pertenece a esta empresa.');
    }

    return campaign;
  }
}