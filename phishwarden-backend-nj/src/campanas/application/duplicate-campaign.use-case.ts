import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';
import type { CampaignEntity } from '../domain/campaign.entity';

export interface DuplicateCampaignCommand {
  name?: string;
  scheduledDate: Date;
}

@Injectable()
export class DuplicateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(
    id: string,
    companyId: number,
    command: DuplicateCampaignCommand,
  ): Promise<CampaignEntity> {
    const source = await this.campaignRepository.findById(id, companyId);

    if (!source) {
      throw new NotFoundException(
        'La campaña origen no existe o no pertenece a esta empresa.',
      );
    }

    if (source.templateId) {
      const isTemplateValid =
        await this.campaignRepository.validateTemplateBelongsToCompanyOrGlobal(
          source.templateId,
          companyId,
        );

      if (!isTemplateValid) {
        throw new BadRequestException(
          'La plantilla de la campaña original ya no se encuentra disponible.',
        );
      }
    }

    return this.campaignRepository.duplicate(
      id,
      companyId,
      command.name,
      command.scheduledDate ? new Date(command.scheduledDate) : undefined,
    );
  }
}
