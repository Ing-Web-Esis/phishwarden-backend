import type { DepartmentEntity } from '../domain/department.entity';

export interface CreateDepartmentInput {
  name: string;
}

export interface DepartmentRepositoryPort {
  findByCompany(companyId: number): Promise<DepartmentEntity[]>;
  findStatsByCompany(companyId: number): Promise<
    Array<{
      id: number;
      nombre: string;
      colaboradores: number;
      scoreRiesgo: number;
    }>
  >;
  findById(id: number, companyId: number): Promise<DepartmentEntity | null>;
  findByName(name: string, companyId: number): Promise<DepartmentEntity | null>;
  create(companyId: number, data: CreateDepartmentInput): Promise<DepartmentEntity>;
  delete(id: number, companyId: number): Promise<boolean>;
}

export const DEPARTMENT_REPOSITORY = 'DEPARTMENT_REPOSITORY';