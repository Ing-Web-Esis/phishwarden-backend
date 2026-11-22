import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';
import type { ShippingMethod, CampaignEntity } from '../domain/campaign.entity';

export interface CreateCampaignCommand {
  name: string;
  templateId: number;
  scheduledDate: Date;
  shippingMethod: ShippingMethod;
  targetUserIds?: string[];
  departmentIds?: number[];
}

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async execute(
    companyId: number,
    command: CreateCampaignCommand,
  ): Promise<CampaignEntity> {
    const hasDirectUsers =
      Array.isArray(command.targetUserIds) && command.targetUserIds.length > 0;
    const hasDepartments =
      Array.isArray(command.departmentIds) && command.departmentIds.length > 0;

    if (!hasDirectUsers && !hasDepartments) {
      throw new BadRequestException(
        'Debe seleccionar al menos un colaborador o departamento objetivo.',
      );
    }

    // 1. Validar plantilla
    const isTemplateValid =
      await this.campaignRepository.validateTemplateBelongsToCompanyOrGlobal(
        command.templateId,
        companyId,
      );

    if (!isTemplateValid) {
      throw new BadRequestException(
        'La plantilla seleccionada no existe o no está autorizada para esta empresa.',
      );
    }

    // 2. Validar usuarios individuales si fueron proporcionados
    if (hasDirectUsers) {
      const areUsersValid =
        await this.campaignRepository.validateUsersBelongToCompany(
          command.targetUserIds!,
          companyId,
        );

      if (!areUsersValid) {
        throw new BadRequestException(
          'Uno o más colaboradores seleccionados no pertenecen a esta empresa.',
        );
      }
    }

    // 3. Resolver usuarios por departamentos si fueron proporcionados
    let deptUserIds: string[] = [];
    if (hasDepartments) {
      deptUserIds =
        await this.campaignRepository.findUserIdsByDepartmentIds(
          command.departmentIds!,
          companyId,
        );
    }

    // 4. Consolidar y deduplicar la lista final de usuarios
    const userSet = new Set<string>();
    if (hasDirectUsers) {
      for (const uid of command.targetUserIds!) {
        userSet.add(uid);
      }
    }
    for (const uid of deptUserIds) {
      userSet.add(uid);
    }

    const consolidatedUserIds = Array.from(userSet);

    if (consolidatedUserIds.length === 0) {
      throw new BadRequestException(
        'No se encontraron colaboradores activos en los objetivos seleccionados.',
      );
    }

    return this.campaignRepository.create(companyId, {
      name: command.name.trim(),
      templateId: command.templateId,
      scheduledDate: new Date(command.scheduledDate),
      shippingMethod: command.shippingMethod,
      targetUserIds: consolidatedUserIds,
    });
  }
}
