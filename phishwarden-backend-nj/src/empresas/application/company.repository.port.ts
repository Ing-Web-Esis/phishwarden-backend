import { CompanyEntity } from '../domain/company.entity';

export interface CreateCompanyAndAdminInput {
  companyName: string;
  accessCode: string;
  adminName: string;
  adminEmail: string;
  passwordHash: string;
}

export interface UpdateCompanyInput {
  nombre?: string;
  codigoAcceso?: string;
}

export interface CompanyRepositoryPort {
  findAdminByEmail(email: string): Promise<boolean>;
  findCompanyByAccessCode(code: string): Promise<CompanyEntity | null>;
  findById(id: number): Promise<CompanyEntity | null>;
  createCompanyWithAdmin(data: CreateCompanyAndAdminInput): Promise<{
    company: CompanyEntity;
    admin: { id: number; name: string; email: string };
  }>;
  updateCompany(id: number, data: UpdateCompanyInput): Promise<CompanyEntity>;
}

export const COMPANY_REPOSITORY = 'COMPANY_REPOSITORY';