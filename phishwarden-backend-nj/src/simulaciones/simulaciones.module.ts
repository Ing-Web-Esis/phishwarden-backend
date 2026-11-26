import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Puertos y Tokens
import { EMAIL_SENDER_PORT } from './application/email-sender.port';
import { SMS_SENDER_PORT } from './application/sms-sender.port';
import { SIMULATION_ALERT_HOOK_PORT } from './application/simulation-alert-hook.port';
import { SIMULATION_TRACKING_REPOSITORY_PORT } from './application/simulation-tracking.repository.port';

// Adaptadores de Infraestructura
import { ResendEmailAdapter } from './infrastructure/resend-email.adapter';
import { TwilioSmsAdapter } from './infrastructure/twilio-sms.adapter';
import { LoggingAlertHookAdapter } from './infrastructure/logging-alert-hook.adapter';
import { PrismaSimulationTrackingRepository } from './infrastructure/prisma-simulation-tracking.repository';
import { CampaignSchedulerService } from './infrastructure/campaign-scheduler.service';
import { TrackingController } from './infrastructure/tracking.controller';

// Casos de Uso
import { DispatchCampaignUseCase } from './application/dispatch-campaign.use-case';
import { ProcessScheduledCampaignsUseCase } from './application/process-scheduled-campaigns.use-case';
import { TrackOpenUseCase } from './application/track-open.use-case';
import { TrackClickUseCase } from './application/track-click.use-case';
import { GetSimulationContextUseCase } from './application/get-simulation-context.use-case';
import { TrackSubmitUseCase } from './application/track-submit.use-case';
import { MobileModule } from '../mobile/mobile.module';

@Module({
  imports: [PrismaModule, MobileModule],
  controllers: [TrackingController],
  providers: [
    {
      provide: EMAIL_SENDER_PORT,
      useClass: ResendEmailAdapter,
    },
    {
      provide: SMS_SENDER_PORT,
      useClass: TwilioSmsAdapter,
    },
    {
      provide: SIMULATION_ALERT_HOOK_PORT,
      useClass: LoggingAlertHookAdapter,
    },
    {
      provide: SIMULATION_TRACKING_REPOSITORY_PORT,
      useClass: PrismaSimulationTrackingRepository,
    },
    DispatchCampaignUseCase,
    ProcessScheduledCampaignsUseCase,
    TrackOpenUseCase,
    TrackClickUseCase,
    GetSimulationContextUseCase,
    TrackSubmitUseCase,
    CampaignSchedulerService,
  ],
  exports: [
    DispatchCampaignUseCase,
    ProcessScheduledCampaignsUseCase,
    GetSimulationContextUseCase,
    TrackOpenUseCase,
    TrackClickUseCase,
    TrackSubmitUseCase,
  ],
})
export class SimulacionesModule {}
