import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type { EmployeeRepositoryPort } from './employee.repository.port';

export interface UpdateEmployeeCommand {
  name?: string;
  email?: string;
  departmentId?: number;
  phone?: string;
}

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(
    companyId: number,
    employeeId: string,
    command: UpdateEmployeeCommand,
  ) {
    const employee = await this.employeeRepository.findEmployeeById(
      companyId,
      employeeId,
    );

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado en esta empresa.');
    }

    return this.employeeRepository.updateEmployee(companyId, employeeId, {
      name: command.name?.trim(),
      email: command.email?.toLowerCase().trim(),
      departmentId: command.departmentId,
      phone: command.phone?.trim(),
    });
  }
}