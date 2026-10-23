import { Module } from '@nestjs/common';
import { GetDepartmentsUseCase } from './application/get-departments.use-case';
import { CreateDepartmentUseCase } from './application/create-department.use-case';
import { DEPARTMENT_REPOSITORY } from './application/department.repository.port';
import { PrismaDepartmentRepository } from './infrastructure/prisma-department.repository';
import { DepartamentosController } from './infrastructure/departamentos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminDepartamentosController } from './infrastructure/admin-departamentos.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DepartamentosController, AdminDepartamentosController],
  providers: [
    GetDepartmentsUseCase,
    CreateDepartmentUseCase,
    {
      provide: DEPARTMENT_REPOSITORY,
      useClass: PrismaDepartmentRepository,
    },
  ],
  exports: [GetDepartmentsUseCase, CreateDepartmentUseCase],
})
export class DepartamentosModule {}