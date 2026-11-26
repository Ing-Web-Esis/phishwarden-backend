import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type { EmployeeRepositoryPort } from './employee.repository.port';

@Injectable()
export class DeleteEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(companyId: number, employeeId: string) {
    const employee = await this.employeeRepository.findEmployeeById(
      companyId,
      employeeId,
    );

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado en esta empresa.');
    }

    await this.employeeRepository.deleteEmployee(companyId, employeeId);

    return {
      message: 'Empleado eliminado exitosamente de la organización.',
      employeeId,
    };
  }
}