import { Injectable, Inject } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from './template.repository.port';
import type {
  TemplateRepositoryPort,
  CreateTemplateInput,
} from './template.repository.port';

@Injectable()
export class CreateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(companyId: number, input: CreateTemplateInput) {
    return this.templateRepository.create(companyId, {
      title: input.title.trim(),
      subject: input.subject.trim(),
      bodyHtml: input.bodyHtml,
      attackType: input.attackType,
      difficulty: input.difficulty,
      isGlobal: false,
    });
  }
}