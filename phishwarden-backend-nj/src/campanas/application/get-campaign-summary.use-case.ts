import { Injectable, Inject } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';
import type { CampaignSummaryResult } from './campaign-summary.result';

@Injectable()
export class GetCampaignSummaryUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(companyId: number): Promise<CampaignSummaryResult> {
    return this.campaignRepository.findSummary(companyId);
  }
}
