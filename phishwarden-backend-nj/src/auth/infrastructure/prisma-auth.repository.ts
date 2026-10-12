import { Injectable } from '@nestjs/common';
import { AuthRepositoryPort } from '../application/auth.repository.port';
import { UserEntity } from '../domain/user.entity';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaAuthRepository implements AuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<any | null> {
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