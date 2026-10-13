import {
  TemplateEntity,
  AttackType,
  DifficultyLevel,
} from '../domain/template.entity';

export interface CreateTemplateInput {
  title: string;
  subject: string;
  bodyHtml: string;
  attackType: AttackType;
  difficulty: DifficultyLevel;
  isGlobal?: boolean;
}

export interface UpdateTemplateInput {
  title?: string;
  subject?: string;
  bodyHtml?: string;
  attackType?: AttackType;
  difficulty?: DifficultyLevel;
}

export interface PaginatedTemplatesResult {
  data: TemplateEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateRepositoryPort {
  findById(id: string): Promise<TemplateEntity | null>;

  // Retorna plantillas globales + las propias de la empresa
  findPaginated(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    attackType?: AttackType,
    difficulty?: DifficultyLevel,
  ): Promise<PaginatedTemplatesResult>;

  create(
    companyId: number | null,
    data: CreateTemplateInput,
  ): Promise<TemplateEntity>;

  update(id: string, data: UpdateTemplateInput): Promise<TemplateEntity>;

  delete(id: string): Promise<boolean>;
}

export const TEMPLATE_REPOSITORY = 'TEMPLATE_REPOSITORY';