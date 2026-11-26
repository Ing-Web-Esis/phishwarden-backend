import { Module } from '@nestjs/common';
import { RegisterCompanyUseCase } from './application/register-company.use-case';
import { GetCompanyByIdUseCase } from './application/get-company-by-id.use-case';
import { UpdateCompanyUseCase } from './application/update-company.use-case';
import { RegenerateAccessCodeUseCase } from './application/regenerate-access-code.use-case';
import { COMPANY_REPOSITORY } from './application/company.repository.port';
import { PrismaCompanyRepository } from './infrastructure/prisma-company.repository';
import { EmpresasController } from './infrastructure/empresas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [EmpresasController],
  providers: [
    RegisterCompanyUseCase,
    GetCompanyByIdUseCase,
    UpdateCompanyUseCase,
    RegenerateAccessCodeUseCase,
    {
      provide: COMPANY_REPOSITORY,
      useClass: PrismaCompanyRepository,
    },
  ],
  exports: [
    RegisterCompanyUseCase,
    GetCompanyByIdUseCase,
    UpdateCompanyUseCase,
    RegenerateAccessCodeUseCase,
  ],
})
export class EmpresasModule {}
