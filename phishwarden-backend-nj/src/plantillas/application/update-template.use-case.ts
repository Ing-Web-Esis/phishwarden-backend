import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from './template.repository.port';
import type {
  TemplateRepositoryPort,
  UpdateTemplateInput,
} from './template.repository.port';
import { PORTAL_REPOSITORY_PORT } from '../../portales/application/portal.repository.port';
import type { PortalRepositoryPort } from '../../portales/application/portal.repository.port';

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
    @Inject(PORTAL_REPOSITORY_PORT)
    private readonly portalRepository: PortalRepositoryPort,
  ) {}

  async execute(
    companyId: number,
    templateId: number,
    input: UpdateTemplateInput,
  ) {
    const existing = await this.templateRepository.findById(templateId);

    if (!existing) {
      throw new NotFoundException('La plantilla de phishing no fue encontrada.');
    }

    if (existing.isGlobal || existing.companyId === null) {
      throw new ForbiddenException(
        'No se pueden modificar plantillas globales del sistema.',
      );
    }

    if (existing.companyId !== companyId) {
      throw new ForbiddenException(
        'No tienes permisos para modificar esta plantilla.',
      );
    }

    if (input.landingId !== undefined && input.landingId !== null) {
      const portal = await this.portalRepository.findById(input.landingId);
      if (!portal) {
        throw new BadRequestException('El portal simulado seleccionado no existe.');
      }
      if (!portal.esGlobal && portal.empresaId !== companyId) {
        throw new BadRequestException(
          'No estás autorizado para usar este portal simulado.',
        );
      }
    }

    return this.templateRepository.update(companyId, templateId, {
      title: input.title?.trim(),
      subject: input.subject?.trim(),
      bodyHtml: input.bodyHtml,
      attackType: input.attackType,
      difficulty: input.difficulty,
      landingTipo: input.landingTipo,
      landingId: input.landingId,
    });
  }
}