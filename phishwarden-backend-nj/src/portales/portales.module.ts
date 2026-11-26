import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PORTAL_REPOSITORY_PORT } from './application/portal.repository.port';
import { PrismaPortalRepository } from './infrastructure/prisma-portal.repository';
import { PortalesController } from './infrastructure/portales.controller';
import { GetPortalsUseCase } from './application/get-portals.use-case';
import { GetPortalByIdUseCase } from './application/get-portal-by-id.use-case';
import { CreatePortalUseCase } from './application/create-portal.use-case';
import { UpdatePortalUseCase } from './application/update-portal.use-case';
import { DeletePortalUseCase } from './application/delete-portal.use-case';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PortalesController],
  providers: [
    {
      provide: PORTAL_REPOSITORY_PORT,
      useClass: PrismaPortalRepository,
    },
    GetPortalsUseCase,
    GetPortalByIdUseCase,
    CreatePortalUseCase,
    UpdatePortalUseCase,
    DeletePortalUseCase,
  ],
  exports: [
    GetPortalsUseCase,
    GetPortalByIdUseCase,
    PORTAL_REPOSITORY_PORT,
  ],
})
export class PortalesModule {}
