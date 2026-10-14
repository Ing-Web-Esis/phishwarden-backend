import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  DepartmentRepositoryPort,
  CreateDepartmentInput,
} from '../application/department.repository.port';
import { DepartmentEntity } from '../domain/department.entity';

@Injectable()
export class PrismaDepartmentRepository implements DepartmentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private get model(): any {
    return (this.prisma as any).departamentos;
  }

  private mapToEntity(item: any): DepartmentEntity {
    return new DepartmentEntity(
      item.id,
      item.empresa_id,
      item.nombre,
      item.fecha_creacion || undefined,
    );
  }

  async findByCompany(companyId: number): Promise<DepartmentEntity[]> {
    if (!this.model) return [];

    const items = await this.model.findMany({
      where: { empresa_id: companyId },
      orderBy: { nombre: 'asc' },
    });

    return items.map((item: any) => this.mapToEntity(item));
  }

  async findById(id: number, companyId: number): Promise<DepartmentEntity | null> {
    if (!this.model) return null;

    const item = await this.model.findFirst({
      where: { id, empresa_id: companyId },
    });

    return item ? this.mapToEntity(item) : null;
  }

  async findByName(name: string, companyId: number): Promise<DepartmentEntity | null> {
    if (!this.model) return null;

    const item = await this.model.findFirst({
      where: {
        empresa_id: companyId,
        nombre: { equals: name, mode: 'insensitive' },
      },
    });

    return item ? this.mapToEntity(item) : null;
  }

  async create(
    companyId: number,
    data: CreateDepartmentInput,
  ): Promise<DepartmentEntity> {
    if (!this.model) {
      throw new Error('El modelo de departamentos no está disponible.');
    }

    const created = await this.model.create({
      data: {
        empresa_id: companyId,
        nombre: data.name,
      },
    });

    return this.mapToEntity(created);
  }

  async delete(id: number, companyId: number): Promise<boolean> {
    if (!this.model) return false;

    await this.model.delete({
      where: { id, empresa_id: companyId },
    });

    return true;
  }
}