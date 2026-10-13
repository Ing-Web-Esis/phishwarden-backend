import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from './template.repository.port';
import type { TemplateRepositoryPort } from './template.repository.port';

@Injectable()
export class DeleteTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(templateId: string) {
    const existing = await this.templateRepository.findById(templateId);

    if (!existing) {
      throw new NotFoundException('La plantilla de phishing no existe.');
    }

    await this.templateRepository.delete(templateId);

    return {
      message: 'Plantilla eliminada exitosamente.',
      templateId,
    };
  }
}