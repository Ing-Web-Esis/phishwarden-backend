import { Module } from '@nestjs/common';
import { RegisterCompanyUseCase } from './application/register-company.use-case';
import { COMPANY_REPOSITORY } from './application/company.repository.port';
import { PrismaCompanyRepository } from './infrastructure/prisma-company.repository';
import { EmpresasController } from './infrastructure/empresas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmpresasController],
  providers: [
    RegisterCompanyUseCase,
    {
      provide: COMPANY_REPOSITORY,
      useClass: PrismaCompanyRepository,
    },
  ],
  exports: [RegisterCompanyUseCase],
})
export class EmpresasModule {}