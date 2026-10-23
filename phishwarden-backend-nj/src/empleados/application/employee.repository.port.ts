import { EmployeeEntity } from '../domain/employee.entity';
import { DepartmentEntity } from '../domain/department.entity';

export interface RawEmployeeCsvRow {
  nombre: string;
  correo: string;
  departamento?: string;
  telefono?: string;
}

export interface BulkImportResult {
  totalProcessed: number;
  importedCount: number;
  skippedCount: number;
  errors: Array<{ line: number; email: string; reason: string }>;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  departmentId?: number;
  phone?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  departmentId?: number;
  phone?: string;
}

export interface PaginatedEmployeesResult {
  data: EmployeeEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface EmployeeSummaryItem {
  id: string;
  nombre: string;
  correo: string;
  departamento: string | null;
  scoreRiesgo: number;
}

export interface PaginatedEmployeeSummaryResult {
  data: EmployeeSummaryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface EmployeeAdminItem {
  nombre: string;
  correo: string;
  telefono: string | null;
  scoreRiesgo: number;
  rachaDiasSeguros: number;
}

export interface EmployeeRepositoryPort {
  findOrCreateDepartment(
    companyId: number,
    departmentName: string,
  ): Promise<DepartmentEntity>;

  bulkCreateEmployees(
    companyId: number,
    employees: Array<{
      name: string;
      email: string;
      departmentId?: number;
      phone?: string;
    }>,
  ): Promise<number>;

  // Verificación global de correos en el sistema
  findExistingEmails(emails: string[]): Promise<Set<string>>;

  findEmployeeById(companyId: number, id: string): Promise<EmployeeEntity | null>;

  findSummaryByCompany(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    departmentId?: number,
  ): Promise<PaginatedEmployeeSummaryResult>;

  findAdminEmployeesByCompany(companyId: number): Promise<EmployeeAdminItem[]>;
  findAdminEmployeeById(
    companyId: number,
    employeeId: string,
  ): Promise<EmployeeAdminItem | null>;
  findSummaryByCompany(
  companyId: number,
  page: number,
  limit: number,
  search?: string,
  ): Promise<PaginatedEmployeeSummaryResult>;

  findEmployeesPaginated(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    departmentId?: number,
  ): Promise<PaginatedEmployeesResult>;

  createEmployee(
    companyId: number,
    data: CreateEmployeeInput,
  ): Promise<EmployeeEntity>;

  updateEmployee(
    companyId: number,
    id: string,
    data: UpdateEmployeeInput,
  ): Promise<EmployeeEntity>;

  deleteEmployee(companyId: number, id: string): Promise<boolean>;
}

export const EMPLOYEE_REPOSITORY = 'EMPLOYEE_REPOSITORY';