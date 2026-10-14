import { Injectable, Inject } from '@nestjs/common';
import { DEPARTMENT_REPOSITORY } from './department.repository.port';
import type { DepartmentRepositoryPort } from './department.repository.port';

@Injectable()
export class GetDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(companyId: number) {
    return this.departmentRepository.findByCompany(companyId);
  }
}