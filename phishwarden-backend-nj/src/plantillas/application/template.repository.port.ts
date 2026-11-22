import {
  TemplateEntity,
  AttackType,
  DifficultyLevel,
  LandingType,
} from '../domain/template.entity';

export interface CreateTemplateInput {
  title: string;
  subject: string;
  bodyHtml: string;
  attackType: AttackType;
  difficulty: DifficultyLevel;
  landingTipo?: LandingType;
  landingId?: number | null;
  isGlobal?: boolean;
}

export interface UpdateTemplateInput {
  title?: string;
  subject?: string;
  bodyHtml?: string;
  attackType?: AttackType;
  difficulty?: DifficultyLevel;
  landingTipo?: LandingType;
  landingId?: number | null;
}

export interface PaginatedTemplatesResult {
  data: TemplateEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateRepositoryPort {
  findById(id: number): Promise<TemplateEntity | null>;

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

  update(
    companyId: number,
    id: number,
    data: UpdateTemplateInput,
  ): Promise<TemplateEntity>;

  delete(companyId: number, id: number): Promise<boolean>;
}

export const TEMPLATE_REPOSITORY = 'TEMPLATE_REPOSITORY';