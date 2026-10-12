import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CompanyRepositoryPort,
  CreateCompanyAndAdminInput,
} from '../application/company.repository.port';
import { CompanyEntity } from '../domain/company.entity';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findAdminByEmail(email: string): Promise<boolean> {
    const admin = await (this.prisma as any).administradores.findFirst({
      where: { correo: email },
    });
    return !!admin;
  }

  async findCompanyByAccessCode(code: string): Promise<CompanyEntity | null> {
    const empresa = await this.prisma.empresas.findFirst({
      where: { codigo_acceso: code } as any,
    });
    if (!empresa) return null;
    return new CompanyEntity(empresa.id, empresa.nombre, (empresa as any).codigo_acceso);
  }

  async createCompanyWithAdmin(data: CreateCompanyAndAdminInput) {
    // Usamos una transacción atómica para garantizar que si falla el admin, no se cree la empresa
    return await this.prisma.$transaction(async (tx) => {
      const empresa = await tx.empresas.create({
        data: {
          nombre: data.companyName,
          codigo_acceso: data.accessCode,
        } as any,
      });

      const admin = await (tx as any).administradores.create({
        data: {
          empresa_id: empresa.id,
          nombre: data.adminName,
          correo: data.adminEmail,
          password_hash: data.passwordHash,
        },
      });

      return {
        company: new CompanyEntity(empresa.id, empresa.nombre, (empresa as any).codigo_acceso),
        admin: {
          id: admin.id,
          name: admin.nombre,
          email: admin.correo,
        },
      };
    });
  }
}