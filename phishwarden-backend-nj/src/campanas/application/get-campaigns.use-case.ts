import { Injectable, Inject } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';
import { CampaignStatus } from '../domain/campaign.entity';

export interface GetCampaignsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus;
}

@Injectable()
export class GetCampaignsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(companyId: number, query: GetCampaignsQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;

    return this.campaignRepository.findPaginated(
      companyId,
      page,
      limit,
      query.search,
      query.status,
    );
  }
}