import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_REPOSITORY } from './auth.repository.port';
import type { AuthRepositoryPort } from './auth.repository.port';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: AuthRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(data: { email: string; password?: string; codigoEmpresa?: string }) {
    const { email, password, codigoEmpresa } = data;

    // 1. FLUJO ADMINISTRADOR (Plataforma Web con correo y contraseña)
    if (password) {
      const admin: any = await (this.authRepository as any).findByEmail(email);
      if (!admin || !admin.passwordHash) {
        throw new UnauthorizedException('Credenciales de administrador inválidas');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales de administrador inválidas');
      }

      return {
        message: 'Acceso de administrador exitoso',
        user: { id: admin.id, email: admin.email, rol: admin.role },
        access_token: await this.jwtService.signAsync({
          sub: admin.id,
          role: admin.role,
          empresaId: admin.empresaId,
        }),
      };
    }

    // 2. FLUJO USUARIO FINAL (App Móvil mediante Correo y Código de Empresa)
    if (codigoEmpresa) {
      const empresa = await this.authRepository.findCompanyByCode(codigoEmpresa);
      if (!empresa) {
        throw new UnauthorizedException('Código de empresa o sala inválido');
      }

      const usuario = await this.authRepository.findUserByEmailAndCompany(email, empresa.id);
      if (!usuario) {
        throw new UnauthorizedException('El correo no pertenece a esta empresa o no es un empleado válido');
      }

      return {
        message: 'Validación por código de empresa exitosa',
        empresa: empresa.name,
        user: { id: usuario.id, email: usuario.email },
      };
    }

    throw new UnauthorizedException('Faltan parámetros de autenticación');
  }

  async getAdminProfile(id: number) {
    return this.authRepository.findAdminProfileById(id);
  }
}