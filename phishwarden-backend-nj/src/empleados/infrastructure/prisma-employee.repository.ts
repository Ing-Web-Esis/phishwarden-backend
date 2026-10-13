import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  EmployeeRepositoryPort,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  PaginatedEmployeesResult,
} from '../application/employee.repository.port';
import { DepartmentEntity } from '../domain/department.entity';
import { EmployeeEntity } from '../domain/employee.entity';

@Injectable()
export class PrismaEmployeeRepository implements EmployeeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateDepartment(
    companyId: number,
    departmentName: string,
  ): Promise<DepartmentEntity> {
    const deptModel = (this.prisma as any).departamentos;

    if (deptModel) {
      const cleanName = departmentName.trim();

      // 1. Buscar si el departamento ya existe por su nombre único
      let dept = await deptModel.findFirst({
        where: { nombre: cleanName },
      });

      // 2. Si no existe, intentar crearlo
      if (!dept) {
        try {
          dept = await deptModel.create({
            data: {
              empresa_id: companyId,
              nombre: cleanName,
            },
          });
        } catch (error) {
          // Manejar si saltó la restricción unique por concurrencia
          dept = await deptModel.findFirst({
            where: { nombre: cleanName },
          });
        }
      }

      if (dept) {
        return new DepartmentEntity(
          dept.id,
          dept.empresa_id || companyId,
          dept.nombre,
        );
      }
    }

    return new DepartmentEntity(0, companyId, departmentName);
  }

  async findExistingEmails(emails: string[]): Promise<Set<string>> {
    const existingUsers = await this.prisma.usuarios.findMany({
      where: {
        correo_corporativo: { in: emails },
      },
      select: { correo_corporativo: true },
    });

    return new Set(
      existingUsers.map((u) => u.correo_corporativo.toLowerCase()),
    );
  }

  async bulkCreateEmployees(
    companyId: number,
    employees: Array<{
      name: string;
      email: string;
      departmentId?: number;
      phone?: string;
    }>,
  ): Promise<number> {
    const records = employees.map((emp) => ({
      empresa_id: companyId,
      nombre: emp.name,
      correo_corporativo: emp.email,
      ...(emp.departmentId && emp.departmentId > 0
        ? { departamento_id: emp.departmentId }
        : {}),
      ...(emp.phone ? { numero_telefonico: emp.phone } : {}),
    }));

    const result = await this.prisma.usuarios.createMany({
      data: records as any,
      skipDuplicates: true,
    });

    return result.count;
  }

  async findEmployeeById(
    companyId: number,
    id: string,
  ): Promise<EmployeeEntity | null> {
    const user = await this.prisma.usuarios.findFirst({
      where: { id, empresa_id: companyId },
    });

    if (!user) return null;

    return new EmployeeEntity(
      user.id,
      user.empresa_id || companyId,
      user.nombre,
      user.correo_corporativo,
      (user as any).departamento_id || null,
      (user as any).numero_telefonico || null,
      user.fecha_registro || undefined,
    );
  }

  async findEmployeesPaginated(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    departmentId?: number,
  ): Promise<PaginatedEmployeesResult> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    const where: any = { empresa_id: companyId };

    if (departmentId) {
      where.departamento_id = Number(departmentId);
    }

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { correo_corporativo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.usuarios.count({ where }),
      this.prisma.usuarios.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { fecha_registro: 'desc' },
      }),
    ]);

    const data = users.map(
      (u) =>
        new EmployeeEntity(
          u.id,
          u.empresa_id || companyId,
          u.nombre,
          u.correo_corporativo,
          (u as any).departamento_id || null,
          (u as any).numero_telefonico || null,
          u.fecha_registro || undefined,
        ),
    );

    return { data, total, page: pageNum, limit: limitNum };
  }

  async createEmployee(
    companyId: number,
    data: CreateEmployeeInput,
  ): Promise<EmployeeEntity> {
    const user = await this.prisma.usuarios.create({
      data: {
        empresa_id: companyId,
        nombre: data.name,
        correo_corporativo: data.email,
        ...(data.departmentId ? { departamento_id: data.departmentId } : {}),
        ...(data.phone ? { numero_telefonico: data.phone } : {}),
      } as any,
    });

    return new EmployeeEntity(
      user.id,
      user.empresa_id || companyId,
      user.nombre,
      user.correo_corporativo,
      (user as any).departamento_id || null,
      (user as any).numero_telefonico || null,
      user.fecha_registro || undefined,
    );
  }

  async updateEmployee(
    companyId: number,
    id: string,
    data: UpdateEmployeeInput,
  ): Promise<EmployeeEntity> {
    const updateData: any = {};
    if (data.name) updateData.nombre = data.name;
    if (data.email) updateData.correo_corporativo = data.email;
    if (data.departmentId !== undefined)
      updateData.departamento_id = data.departmentId;
    if (data.phone !== undefined) updateData.numero_telefonico = data.phone;

    const user = await this.prisma.usuarios.update({
      where: { id },
      data: updateData,
    });

    return new EmployeeEntity(
      user.id,
      user.empresa_id || companyId,
      user.nombre,
      user.correo_corporativo,
      (user as any).departamento_id || null,
      (user as any).numero_telefonico || null,
      user.fecha_registro || undefined,
    );
  }

  async deleteEmployee(companyId: number, id: string): Promise<boolean> {
    await this.prisma.usuarios.delete({
      where: { id },
    });
    return true;
  }
}