import { Module } from '@nestjs/common';
import { BulkImportEmployeesUseCase } from './application/bulk-import-employees.use-case';
import { GetEmployeesUseCase } from './application/get-employees.use-case';
import { CreateEmployeeUseCase } from './application/create-employee.use-case';
import { UpdateEmployeeUseCase } from './application/update-employee.use-case';
import { DeleteEmployeeUseCase } from './application/delete-employee.use-case';

import { EMPLOYEE_REPOSITORY } from './application/employee.repository.port';
import { PrismaEmployeeRepository } from './infrastructure/prisma-employee.repository';
import { EmpleadosController } from './infrastructure/empleados.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmpleadosController],
  providers: [
    BulkImportEmployeesUseCase,
    GetEmployeesUseCase,
    CreateEmployeeUseCase,
    UpdateEmployeeUseCase,
    DeleteEmployeeUseCase,
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: PrismaEmployeeRepository,
    },
  ],
  exports: [
    BulkImportEmployeesUseCase,
    GetEmployeesUseCase,
    CreateEmployeeUseCase,
    UpdateEmployeeUseCase,
    DeleteEmployeeUseCase,
  ],
})
export class EmpleadosModule {}