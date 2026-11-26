import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from './template.repository.port';
import type { TemplateRepositoryPort } from './template.repository.port';

@Injectable()
export class DeleteTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(companyId: number, templateId: number) {
    const existing = await this.templateRepository.findById(templateId);

    if (!existing) {
      throw new NotFoundException('La plantilla de phishing no existe.');
    }

    if (existing.isGlobal || existing.companyId === null) {
      throw new ForbiddenException(
        'No se pueden eliminar plantillas globales del sistema.',
      );
    }

    if (existing.companyId !== companyId) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta plantilla.',
      );
    }

    await this.templateRepository.delete(companyId, templateId);

    return {
      message: 'Plantilla eliminada exitosamente.',
      templateId,
    };
  }
}