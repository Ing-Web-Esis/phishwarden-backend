import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { COMPANY_REPOSITORY } from './company.repository.port';
import type { CompanyRepositoryPort } from './company.repository.port';
import { UpdateCompanyDto } from '../infrastructure/update-company.dto';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepositoryPort,
  ) {}

  async execute(companyId: number, dto: UpdateCompanyDto) {
    if (!dto.nombre || !dto.nombre.trim()) {
      throw new BadRequestException('Debes enviar un nombre válido para actualizar');
    }

    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const updated = await this.companyRepository.updateCompany(companyId, {
      nombre: dto.nombre.trim(),
    });

    return {
      id: updated.id,
      nombre: updated.name,
      codigoAcceso: updated.accessCode,
      fechaCreacion: updated.createdAt,
    };
  }
}
