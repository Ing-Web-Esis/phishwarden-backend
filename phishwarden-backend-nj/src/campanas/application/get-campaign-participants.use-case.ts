import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type {
  CampaignRepositoryPort,
  FindParticipantsParams,
} from './campaign.repository.port';
import type { PaginatedParticipantsResult } from './campaign-participant.result';

@Injectable()
export class GetCampaignParticipantsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(
    campaignId: string,
    companyId: number,
    params: FindParticipantsParams,
  ): Promise<PaginatedParticipantsResult> {
    const campaign = await this.campaignRepository.findById(
      campaignId,
      companyId,
    );

    if (!campaign) {
      throw new NotFoundException(
        'La campaña no existe o no pertenece a esta empresa.',
      );
    }

    return this.campaignRepository.findParticipantsPaginated(
      campaignId,
      companyId,
      params,
    );
  }
}
