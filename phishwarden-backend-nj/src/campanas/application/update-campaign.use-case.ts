import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type {
  CampaignRepositoryPort,
  UpdateCampaignInput,
} from './campaign.repository.port';
import { CampaignStatus, type CampaignEntity } from '../domain/campaign.entity';

@Injectable()
export class UpdateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(
    id: string,
    companyId: number,
    input: UpdateCampaignInput,
  ): Promise<CampaignEntity> {
    const campaign = await this.campaignRepository.findById(id, companyId);

    if (!campaign) {
      throw new NotFoundException(
        'La campaña no existe o no pertenece a esta empresa.',
      );
    }

    if (campaign.status !== CampaignStatus.PROGRAMADA) {
      throw new BadRequestException(
        'Solo se pueden editar campañas que se encuentren en estado programada.',
      );
    }

    if (input.templateId !== undefined) {
      const isTemplateValid =
        await this.campaignRepository.validateTemplateBelongsToCompanyOrGlobal(
          input.templateId,
          companyId,
        );

      if (!isTemplateValid) {
        throw new BadRequestException(
          'La plantilla seleccionada no existe o no está autorizada para esta empresa.',
        );
      }
    }

    return this.campaignRepository.update(id, companyId, {
      ...input,
      name: input.name ? input.name.trim() : undefined,
    });
  }
}
