import { Module } from '@nestjs/common';
import { GetTemplatesUseCase } from './application/get-templates.use-case';
import { CreateTemplateUseCase } from './application/create-template.use-case';
import { UpdateTemplateUseCase } from './application/update-template.use-case';
import { DeleteTemplateUseCase } from './application/delete-template.use-case';

import { TEMPLATE_REPOSITORY } from './application/template.repository.port';
import { PrismaTemplateRepository } from './infrastructure/prisma-template.repository';
import { PlantillasController } from './infrastructure/plantillas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PortalesModule } from '../portales/portales.module';

@Module({
  imports: [PrismaModule, AuthModule, PortalesModule],
  controllers: [PlantillasController],
  providers: [
    GetTemplatesUseCase,
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    DeleteTemplateUseCase,
    {
      provide: TEMPLATE_REPOSITORY,
      useClass: PrismaTemplateRepository,
    },
  ],
  exports: [
    GetTemplatesUseCase,
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    DeleteTemplateUseCase,
  ],
})
export class PlantillasModule {}