import { Module } from '@nestjs/common';
import { GetCampaignSummaryUseCase } from './application/get-campaign-summary.use-case';
import { GetCampaignsUseCase } from './application/get-campaigns.use-case';
import { GetCampaignByIdUseCase } from './application/get-campaign-by-id.use-case';
import { GetCampaignParticipantsUseCase } from './application/get-campaign-participants.use-case';
import { CreateCampaignUseCase } from './application/create-campaign.use-case';
import { UpdateCampaignUseCase } from './application/update-campaign.use-case';
import { ManageCampaignParticipantsUseCase } from './application/manage-campaign-participants.use-case';
import { DuplicateCampaignUseCase } from './application/duplicate-campaign.use-case';
import { CancelCampaignUseCase } from './application/cancel-campaign.use-case';
import { FinalizeCampaignUseCase } from './application/finalize-campaign.use-case';

import { CAMPAIGN_REPOSITORY } from './application/campaign.repository.port';
import { PrismaCampaignRepository } from './infrastructure/prisma-campaign.repository';
import { CampanasController } from './infrastructure/campanas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { SimulacionesModule } from '../simulaciones/simulaciones.module';

@Module({
  imports: [PrismaModule, AuthModule, SimulacionesModule],
  controllers: [CampanasController],
  providers: [
    GetCampaignSummaryUseCase,
    GetCampaignsUseCase,
    GetCampaignByIdUseCase,
    GetCampaignParticipantsUseCase,
    CreateCampaignUseCase,
    UpdateCampaignUseCase,
    ManageCampaignParticipantsUseCase,
    DuplicateCampaignUseCase,
    CancelCampaignUseCase,
    FinalizeCampaignUseCase,
    {
      provide: CAMPAIGN_REPOSITORY,
      useClass: PrismaCampaignRepository,
    },
  ],
  exports: [
    GetCampaignSummaryUseCase,
    GetCampaignsUseCase,
    GetCampaignByIdUseCase,
    GetCampaignParticipantsUseCase,
    CreateCampaignUseCase,
    UpdateCampaignUseCase,
    ManageCampaignParticipantsUseCase,
    DuplicateCampaignUseCase,
    CancelCampaignUseCase,
    FinalizeCampaignUseCase,
  ],
})
export class CampanasModule {}
