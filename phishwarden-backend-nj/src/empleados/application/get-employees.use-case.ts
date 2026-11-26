import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_REPOSITORY } from './employee.repository.port';
import type { EmployeeRepositoryPort } from './employee.repository.port';

export interface GetEmployeesQuery {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: number;
}

@Injectable()
export class GetEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(companyId: number, query: GetEmployeesQuery) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 10;
    const deptId = query.departmentId ? Number(query.departmentId) : undefined;

    return this.employeeRepository.findEmployeesPaginated(
      companyId,
      page,
      limit,
      query.search,
      deptId,
    );
  }

  async getAdminEmployees(companyId: number) {
    return this.employeeRepository.findAdminEmployeesByCompany(companyId);
  }

  async getAdminEmployee(companyId: number, employeeId: string) {
    return this.employeeRepository.findAdminEmployeeById(companyId, employeeId);
  }
}