import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from './template.repository.port';
import type {
  TemplateRepositoryPort,
  UpdateTemplateInput,
} from './template.repository.port';

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(templateId: string, input: UpdateTemplateInput) {
    const existing = await this.templateRepository.findById(templateId);

    if (!existing) {
      throw new NotFoundException('La plantilla de phishing no fue encontrada.');
    }

    return this.templateRepository.update(templateId, {
      title: input.title?.trim(),
      subject: input.subject?.trim(),
      bodyHtml: input.bodyHtml,
      attackType: input.attackType,
      difficulty: input.difficulty,
    });
  }
}