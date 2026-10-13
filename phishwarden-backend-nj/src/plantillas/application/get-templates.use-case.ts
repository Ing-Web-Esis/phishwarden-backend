import { Injectable, Inject } from '@nestjs/common';
import { TEMPLATE_REPOSITORY } from './template.repository.port';
import type { TemplateRepositoryPort } from './template.repository.port';
import { AttackType, DifficultyLevel } from '../domain/template.entity';

export interface GetTemplatesQuery {
  page?: number;
  limit?: number;
  search?: string;
  attackType?: AttackType;
  difficulty?: DifficultyLevel;
}

@Injectable()
export class GetTemplatesUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(companyId: number, query: GetTemplatesQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;

    return this.templateRepository.findPaginated(
      companyId,
      page,
      limit,
      query.search,
      query.attackType,
      query.difficulty,
    );
  }
}