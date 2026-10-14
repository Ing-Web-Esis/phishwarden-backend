import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type { EmployeeRepositoryPort } from './employee.repository.port';

export interface GetEmployeesSummaryQuery {
  page?: number;
  limit?: number;
  search?: string;
}

@Injectable()
export class GetEmployeesSummaryUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(companyId: number, query: GetEmployeesSummaryQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;

    return this.employeeRepository.findSummaryByCompany(
      companyId,
      page,
      limit,
      query.search,
    );
  }
}