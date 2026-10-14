import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DEPARTMENT_REPOSITORY } from './department.repository.port';
import type {
  DepartmentRepositoryPort,
  CreateDepartmentInput,
} from './department.repository.port';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(companyId: number, input: CreateDepartmentInput) {
    const trimmedName = input.name.trim();

    if (!trimmedName) {
      throw new BadRequestException('El nombre del departamento es obligatorio.');
    }

    const existing = await this.departmentRepository.findByName(
      trimmedName,
      companyId,
    );

    if (existing) {
      throw new BadRequestException(
        `El departamento "${trimmedName}" ya existe en esta empresa.`,
      );
    }

    return this.departmentRepository.create(companyId, { name: trimmedName });
  }
}