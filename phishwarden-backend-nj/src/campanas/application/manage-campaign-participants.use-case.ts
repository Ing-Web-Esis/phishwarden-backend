import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CAMPAIGN_REPOSITORY } from './campaign.repository.port';
import type { CampaignRepositoryPort } from './campaign.repository.port';
import { CampaignStatus } from '../domain/campaign.entity';

export interface ManageParticipantsCommand {
  targetUserIds?: string[];
  departmentIds?: number[];
}

@Injectable()
export class ManageCampaignParticipantsUseCase {
  constructor(
    @Inject(CAMPAIGN_REPOSITORY)
    private readonly campaignRepository: CampaignRepositoryPort,
  ) {}

  async addParticipants(
    campaignId: string,
    companyId: number,
    command: ManageParticipantsCommand,
  ) {
    const campaign = await this.campaignRepository.findById(
      campaignId,
      companyId,
    );

    if (!campaign) {
      throw new NotFoundException(
        'La campaña no existe o no pertenece a esta empresa.',
      );
    }

    if (campaign.status !== CampaignStatus.PROGRAMADA) {
      throw new BadRequestException(
        'Solo se pueden modificar participantes en campañas que se encuentren en estado programada.',
      );
    }

    const hasDirectUsers =
      Array.isArray(command.targetUserIds) && command.targetUserIds.length > 0;
    const hasDepartments =
      Array.isArray(command.departmentIds) && command.departmentIds.length > 0;

    if (!hasDirectUsers && !hasDepartments) {
      throw new BadRequestException(
        'Debe seleccionar al menos un colaborador o departamento objetivo.',
      );
    }

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

    let deptUserIds: string[] = [];
    if (hasDepartments) {
      deptUserIds =
        await this.campaignRepository.findUserIdsByDepartmentIds(
          command.departmentIds!,
          companyId,
        );
    }

    const userSet = new Set<string>();
    if (hasDirectUsers) {
      for (const uid of command.targetUserIds!) {
        userSet.add(uid);
      }
    }
    for (const uid of deptUserIds) {
      userSet.add(uid);
    }

    const userIds = Array.from(userSet);

    if (userIds.length === 0) {
      throw new BadRequestException(
        'No se encontraron colaboradores activos en los objetivos seleccionados.',
      );
    }

    const added = await this.campaignRepository.addParticipants(
      campaignId,
      companyId,
      userIds,
    );

    return {
      message: `Se agregaron ${added} nuevos participantes a la campaña.`,
      added,
    };
  }

  async removeParticipant(
    campaignId: string,
    companyId: number,
    userId: string,
  ) {
    const campaign = await this.campaignRepository.findById(
      campaignId,
      companyId,
    );

    if (!campaign) {
      throw new NotFoundException(
        'La campaña no existe o no pertenece a esta empresa.',
      );
    }

    if (campaign.status !== CampaignStatus.PROGRAMADA) {
      throw new BadRequestException(
        'Solo se pueden modificar participantes en campañas que se encuentren en estado programada.',
      );
    }

    // 1. Verificar primero que el usuario esté inscrito en la campaña (NotFoundException si no)
    const isEnrolled =
      await this.campaignRepository.isUserEnrolledInCampaign(
        campaignId,
        userId,
      );

    if (!isEnrolled) {
      throw new NotFoundException(
        'El colaborador no se encuentra inscrito en esta campaña.',
      );
    }

    // 2. Verificar que la campaña no quede vacía (BadRequestException si es el último)
    const totalCount = await this.campaignRepository.countParticipants(
      campaignId,
      companyId,
    );

    if (totalCount <= 1) {
      throw new BadRequestException(
        'No se puede remover al colaborador porque la campaña debe conservar al menos un participante.',
      );
    }

    await this.campaignRepository.removeParticipant(
      campaignId,
      companyId,
      userId,
    );

    return {
      message: 'Colaborador retirado exitosamente de la campaña.',
      usuarioId: userId,
    };
  }
}
