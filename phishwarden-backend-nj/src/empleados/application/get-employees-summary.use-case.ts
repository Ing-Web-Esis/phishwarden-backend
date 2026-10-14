import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type { EmployeeRepositoryPort } from './employee.repository.port';

@Injectable()
export class GetEmployeesSummaryUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(companyId: number) {
    return this.employeeRepository.findSummaryByCompany(companyId);
  }
}