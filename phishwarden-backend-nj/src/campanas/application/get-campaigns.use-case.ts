import { Injectable, Inject } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type {
  CampaignRepositoryPort,
  PaginatedCampaignsResult,
} from './campaign.repository.port';
import type { CampaignStatus } from '../domain/campaign.entity';

export interface GetCampaignsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus;
  attackType?: string;
}

@Injectable()
export class GetCampaignsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(
    companyId: number,
    query: GetCampaignsQuery,
  ): Promise<PaginatedCampaignsResult> {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;

    return this.campaignRepository.findPaginated(companyId, {
      page,
      limit,
      search: query.search?.trim(),
      status: query.status,
      attackType: query.attackType?.trim(),
    });
  }
}
