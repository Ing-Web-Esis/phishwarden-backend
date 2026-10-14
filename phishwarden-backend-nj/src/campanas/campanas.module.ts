import { Module } from '@nestjs/common';
import { GetCampaignsUseCase } from './application/get-campaigns.use-case';
import { GetCampaignByIdUseCase } from './application/get-campaign-by-id.use-case';
import { CreateCampaignUseCase } from './application/create-campaign.use-case';
import { CancelCampaignUseCase } from './application/cancel-campaign.use-case';

import { CAMPAIGN_REPOSITORY } from './application/campaign.repository.port';
import { PrismaCampaignRepository } from './infrastructure/prisma-campaign.repository';
import { CampanasController } from './infrastructure/campanas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CampanasController],
  providers: [
    GetCampaignsUseCase,
    GetCampaignByIdUseCase,
    CreateCampaignUseCase,
    CancelCampaignUseCase,
    {
      provide: CAMPAIGN_REPOSITORY,
      useClass: PrismaCampaignRepository,
    },
  ],
  exports: [
    GetCampaignsUseCase,
    GetCampaignByIdUseCase,
    CreateCampaignUseCase,
    CancelCampaignUseCase,
  ],
})
export class CampanasModule {}