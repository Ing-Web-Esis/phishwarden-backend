import { Injectable } from '@nestjs/common';
import { AuthRepositoryPort } from '../application/auth.repository.port';
import { UserEntity } from '../domain/user.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaAuthRepository implements AuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<{
    id: number;
    email: string;
    passwordHash: string;
    role: string;
    empresaId?: number;
  } | null> {
    // Busca en la tabla exclusiva de administradores
    const admin = await (this.prisma as any).administradores.findFirst({
      where: { correo: email },
    });
    if (!admin) return null;
    return {
      id: admin.id,
      email: admin.correo,
      passwordHash: admin.password_hash,
      role: 'administrador',
      empresaId: admin.empresa_id ?? undefined,
    };
  }

  async findAdminProfileById(id: number) {
    const admin = await this.prisma.administradores.findUnique({
      where: { id },
      include: { empresas: true },
    });
    if (!admin) return null;

    return {
      id: String(admin.id),
      nombre: admin.nombre,
      correo: admin.correo,
      empresaId: admin.empresa_id,
      empresa: admin.empresas
        ? { id: admin.empresas.id, nombre: admin.empresas.nombre }
        : null,
    };
  }

  async findAdminCredentialsById(id: number) {
    const admin = await this.prisma.administradores.findUnique({
      where: { id },
      select: { id: true, password_hash: true },
    });
    if (!admin) return null;

    return { id: admin.id, passwordHash: admin.password_hash };
  }

  async updateAdminProfile(
    id: number,
    data: {
      nombre?: string;
      correo?: string;
      nombreEmpresa?: string;
      passwordHash?: string;
    },
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const admin = await transaction.administradores.findUnique({
        where: { id },
        select: { empresa_id: true },
      });

      if (!admin) {
        throw new Error('Administrador no encontrado');
      }

      await transaction.administradores.update({
        where: { id },
        data: {
          ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
          ...(data.correo !== undefined ? { correo: data.correo } : {}),
          ...(data.passwordHash !== undefined
            ? { password_hash: data.passwordHash }
            : {}),
        },
      });

      if (data.nombreEmpresa !== undefined && admin.empresa_id !== null) {
        await transaction.empresas.update({
          where: { id: admin.empresa_id },
          data: { nombre: data.nombreEmpresa },
        });
      }
    });
  }

  async findCompanyByCode(code: string): Promise<{ id: number; name: string } | null> {
    const empresa = await this.prisma.empresas.findFirst({
      where: { codigo_acceso: code } as any,
    });
    if (!empresa) return null;
    return { id: empresa.id, name: empresa.nombre };
  }

  async findUserByEmailAndCompany(email: string, empresaId: number): Promise<UserEntity | null> {
    // Busca en la tabla de empleados (usuarios) vinculada a la empresa
    const usuario = await this.prisma.usuarios.findFirst({
      where: {
        correo_corporativo: email,
        empresa_id: empresaId,
      },
    });
    if (!usuario) return null;
    return new UserEntity(
      usuario.id,
      usuario.correo_corporativo,
      String(usuario.departamento_id || 'Sin Departamento'),
      usuario.empresa_id ?? undefined,
    );
  }
}