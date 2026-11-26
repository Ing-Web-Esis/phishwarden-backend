import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MobileController } from './infrastructure/mobile.controller';
import { VincularMobileUseCase } from './application/vincular-mobile.use-case';
import { GetMobileProfileUseCase } from './application/get-mobile-profile.use-case';
import { UpdatePushTokenUseCase } from './application/update-push-token.use-case';
import { RemovePushTokenUseCase } from './application/remove-push-token.use-case';
import { ReportSuspiciousMessageUseCase } from './application/report-suspicious-message.use-case';
import { GetMobileLessonsUseCase } from './application/get-mobile-lessons.use-case';
import { GetMobileLessonDetailUseCase } from './application/get-mobile-lesson-detail.use-case';
import { EvaluateMobileLessonUseCase } from './application/evaluate-mobile-lesson.use-case';
import { GetMobileBadgesUseCase } from './application/get-mobile-badges.use-case';
import { GetMobileRankingUseCase } from './application/get-mobile-ranking.use-case';
import { AssignReactiveLessonUseCase } from './application/assign-reactive-lesson.use-case';
import { EmployeeJwtGuard } from './infrastructure/employee-jwt.guard';
import { MOBILE_REPOSITORY_PORT } from './application/mobile.repository.port';
import { PUSH_NOTIFICATION_PORT } from './application/push-notification.port';
import { PrismaMobileRepository } from './infrastructure/prisma-mobile.repository';
import { FcmPushService } from './infrastructure/fcm-push.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MobileController],
  providers: [
    VincularMobileUseCase,
    GetMobileProfileUseCase,
    UpdatePushTokenUseCase,
    RemovePushTokenUseCase,
    ReportSuspiciousMessageUseCase,
    GetMobileLessonsUseCase,
    GetMobileLessonDetailUseCase,
    EvaluateMobileLessonUseCase,
    GetMobileBadgesUseCase,
    GetMobileRankingUseCase,
    AssignReactiveLessonUseCase,
    EmployeeJwtGuard,
    FcmPushService,
    {
      provide: MOBILE_REPOSITORY_PORT,
      useClass: PrismaMobileRepository,
    },
    {
      provide: PUSH_NOTIFICATION_PORT,
      useClass: FcmPushService,
    },
  ],
  exports: [
    PUSH_NOTIFICATION_PORT,
    FcmPushService,
    EmployeeJwtGuard,
    AssignReactiveLessonUseCase,
  ],
})
export class MobileModule {}
