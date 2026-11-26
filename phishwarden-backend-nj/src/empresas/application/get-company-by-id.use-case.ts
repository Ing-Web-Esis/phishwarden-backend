import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { COMPANY_REPOSITORY } from './company.repository.port';
import type { CompanyRepositoryPort } from './company.repository.port';

@Injectable()
export class GetCompanyByIdUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepositoryPort,
  ) {}

  async execute(id: number) {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Organización no encontrada.');
    }

    return {
      id: company.id,
      nombre: company.name,
      codigoAcceso: company.accessCode,
      plan: company.plan || 'professional',
      fechaCreacion: company.createdAt,
    };
  }
}
