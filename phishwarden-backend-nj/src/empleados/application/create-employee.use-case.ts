import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type { EmployeeRepositoryPort } from './employee.repository.port';

export interface CreateEmployeeCommand {
  name: string;
  email: string;
  departmentId?: number;
  departmentName?: string;
  phone?: string;
}

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(companyId: number, command: CreateEmployeeCommand) {
    const email = command.email.toLowerCase().trim();

    // Verificación global llamando al método actualizado
    const existing = await this.employeeRepository.findExistingEmails([email]);

    if (existing.has(email)) {
      throw new ConflictException(
        'El correo corporativo ya se encuentra registrado en el sistema.',
      );
    }

    let deptId = command.departmentId;
    if (!deptId && command.departmentName) {
      const dept = await this.employeeRepository.findOrCreateDepartment(
        companyId,
        command.departmentName.trim(),
      );
      deptId = dept.id;
    }

    return this.employeeRepository.createEmployee(companyId, {
      name: command.name.trim(),
      email,
      departmentId: deptId,
      phone: command.phone?.trim(),
    });
  }
}