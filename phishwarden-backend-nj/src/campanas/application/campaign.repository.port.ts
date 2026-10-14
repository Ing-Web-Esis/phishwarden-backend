import {
  CampaignEntity,
  CampaignStatus,
  ShippingMethod,
} from '../domain/campaign.entity';

export interface CreateCampaignInput {
  name: string;
  templateId: number;
  scheduledDate: Date;
  shippingMethod: ShippingMethod;
  targetUserIds: string[];
}

export interface UpdateCampaignInput {
  name?: string;
  templateId?: number;
  scheduledDate?: Date;
  shippingMethod?: ShippingMethod;
  status?: CampaignStatus;
}

export interface PaginatedCampaignsResult {
  data: CampaignEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignRepositoryPort {
  findById(id: string, companyId?: number): Promise<CampaignEntity | null>;

  findPaginated(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    status?: CampaignStatus,
  ): Promise<PaginatedCampaignsResult>;

  create(companyId: number, data: CreateCampaignInput): Promise<CampaignEntity>;

  update(id: string, data: UpdateCampaignInput): Promise<CampaignEntity>;

  cancel(id: string): Promise<boolean>;

  validateUsersBelongToCompany(
    userIds: string[],
    companyId: number,
  ): Promise<boolean>;
}

export const CAMPAIGN_REPOSITORY = 'CAMPAIGN_REPOSITORY';