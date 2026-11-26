import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { COMPANY_REPOSITORY } from './company.repository.port';
import type { CompanyRepositoryPort } from './company.repository.port';
import { CompanyEntity } from '../domain/company.entity';

@Injectable()
export class RegenerateAccessCodeUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepositoryPort,
  ) {}

  async execute(companyId: number) {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    let newCode = CompanyEntity.generateAccessCode();
    let codeExists = await this.companyRepository.findCompanyByAccessCode(newCode);

    while (codeExists) {
      newCode = CompanyEntity.generateAccessCode();
      codeExists = await this.companyRepository.findCompanyByAccessCode(newCode);
    }

    const updated = await this.companyRepository.updateCompany(companyId, {
      codigoAcceso: newCode,
    });

    return {
      id: updated.id,
      nombre: updated.name,
      codigoAcceso: updated.accessCode,
      mensaje: 'Código de acceso regenerado exitosamente',
    };
  }
}
