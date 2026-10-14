import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type {
  CampaignRepositoryPort,
  CreateCampaignInput,
} from './campaign.repository.port';

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(companyId: number, input: CreateCampaignInput) {
    if (!input.targetUserIds || input.targetUserIds.length === 0) {
      throw new BadRequestException(
        'Debe seleccionar al menos un usuario objetivo para la campaña.',
      );
    }

    // Validación Multi-tenant: Verificar que todos los usuarios pertenezcan a la empresa
    const validUsers = await this.campaignRepository.validateUsersBelongToCompany(
      input.targetUserIds,
      companyId,
    );

    if (!validUsers) {
      throw new BadRequestException(
        'Uno o más usuarios seleccionados no pertenecen a esta empresa.',
      );
    }

    return this.campaignRepository.create(companyId, {
      ...input,
      name: input.name.trim(),
    });
  }
}