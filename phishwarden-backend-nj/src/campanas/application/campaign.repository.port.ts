import type {
  CampaignEntity,
  CampaignStatus,
  ShippingMethod,
} from '../domain/campaign.entity';
import type { CampaignSummaryResult } from './campaign-summary.result';
import type { CampaignDetailResult } from './campaign-detail.result';
import type { PaginatedParticipantsResult } from './campaign-participant.result';

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

export interface FindCampaignsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CampaignStatus;
  attackType?: string;
}

export interface FindParticipantsParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
}

export interface PaginatedCampaignsResult {
  data: CampaignEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignRepositoryPort {
  findSummary(companyId: number): Promise<CampaignSummaryResult>;

  findPaginated(
    companyId: number,
    params: FindCampaignsParams,
  ): Promise<PaginatedCampaignsResult>;

  findById(id: string, companyId?: number): Promise<CampaignDetailResult | null>;

  findParticipantsPaginated(
    campaignId: string,
    companyId: number,
    params: FindParticipantsParams,
  ): Promise<PaginatedParticipantsResult>;

  create(companyId: number, data: CreateCampaignInput): Promise<CampaignEntity>;

  update(
    id: string,
    companyId: number,
    data: UpdateCampaignInput,
  ): Promise<CampaignEntity>;

  addParticipants(
    campaignId: string,
    companyId: number,
    userIds: string[],
  ): Promise<number>;

  removeParticipant(
    campaignId: string,
    companyId: number,
    userId: string,
  ): Promise<boolean>;

  countParticipants(campaignId: string, companyId: number): Promise<number>;

  isUserEnrolledInCampaign(campaignId: string, userId: string): Promise<boolean>;

  duplicate(
    id: string,
    companyId: number,
    newName?: string,
    scheduledDate?: Date,
  ): Promise<CampaignEntity>;

  cancel(id: string, companyId: number): Promise<boolean>;

  finalize(id: string, companyId: number): Promise<boolean>;

  validateTemplateBelongsToCompanyOrGlobal(
    templateId: number,
    companyId: number,
  ): Promise<boolean>;

  validateUsersBelongToCompany(
    userIds: string[],
    companyId: number,
  ): Promise<boolean>;

  findUserIdsByDepartmentIds(
    departmentIds: number[],
    companyId: number,
  ): Promise<string[]>;
}

export const CAMPAIGN_REPOSITORY = 'CAMPAIGN_REPOSITORY';
