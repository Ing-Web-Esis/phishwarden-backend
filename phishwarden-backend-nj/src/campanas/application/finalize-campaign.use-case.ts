import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';
import { CampaignStatus } from '../domain/campaign.entity';

@Injectable()
export class FinalizeCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(id: string, companyId: number) {
    const existing = await this.campaignRepository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException(
        'La campaña no fue encontrada o no pertenece a esta empresa.',
      );
    }

    if (existing.status !== CampaignStatus.EN_CURSO) {
      throw new BadRequestException(
        'Solo se pueden finalizar campañas que se encuentren en curso.',
      );
    }

    await this.campaignRepository.finalize(id, companyId);

    return {
      message: 'Campaña finalizada exitosamente.',
      campaignId: id,
    };
  }
}
