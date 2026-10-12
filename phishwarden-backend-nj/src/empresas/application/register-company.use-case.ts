import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { COMPANY_REPOSITORY } from './company.repository.port';
import type { CompanyRepositoryPort } from './company.repository.port';
import { CompanyEntity } from '../domain/company.entity';

export interface RegisterCompanyCommand {
  companyName: string;
  adminName: string;
  adminEmail: string;
  password: string;
}

@Injectable()
export class RegisterCompanyUseCase {
  constructor(
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepositoryPort,
  ) {}

  async execute(command: RegisterCompanyCommand) {
    // 1. Validar que el correo del administrador no esté registrado previamente
    const adminExists = await this.companyRepository.findAdminByEmail(
      command.adminEmail,
    );
    if (adminExists) {
      throw new ConflictException(
        'El correo corporativo ya se encuentra registrado.',
      );
    }

    // 2. Generar un código de acceso único para la empresa
    let accessCode = CompanyEntity.generateAccessCode();
    let codeExists = await this.companyRepository.findCompanyByAccessCode(
      accessCode,
    );

    // Garantizar unicidad en el código
    while (codeExists) {
      accessCode = CompanyEntity.generateAccessCode();
      codeExists = await this.companyRepository.findCompanyByAccessCode(
        accessCode,
      );
    }

    // 3. Hashear la contraseña del administrador
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(command.password, saltRounds);

    // 4. Crear la empresa y el administrador en una sola transacción atómica
    const result = await this.companyRepository.createCompanyWithAdmin({
      companyName: command.companyName,
      accessCode,
      adminName: command.adminName,
      adminEmail: command.adminEmail,
      passwordHash,
    });

    return {
      message: 'Organización y administrador registrados exitosamente.',
      empresa: {
        id: result.company.id,
        nombre: result.company.name,
        codigoAcceso: result.company.accessCode,
      },
      administrador: {
        id: result.admin.id,
        nombre: result.admin.name,
        correo: result.admin.email,
      },
    };
  }
}