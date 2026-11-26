import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

  async updateAdminProfile(
    id: number,
    data: {
      nombre?: string;
      correo?: string;
      nombreEmpresa?: string;
      contraseñaActual?: string;
      nuevaContraseña?: string;
    },
  ) {
    if (
      data.nombre === undefined &&
      data.correo === undefined &&
      data.nombreEmpresa === undefined &&
      data.nuevaContraseña === undefined
    ) {
      throw new BadRequestException(
        'Debes enviar al menos un campo para actualizar',
      );
    }

    if (data.nuevaContraseña !== undefined && !data.contraseñaActual) {
      throw new BadRequestException(
        'La contraseña actual es obligatoria para cambiar la contraseña',
      );
    }

    if (data.nombreEmpresa !== undefined) {
      const profile = await this.authRepository.findAdminProfileById(id);
      if (!profile) {
        throw new UnauthorizedException('Administrador no encontrado');
      }
      if (!profile.empresaId) {
        throw new BadRequestException(
          'El administrador no tiene una empresa asignada',
        );
      }
    }

    let passwordHash: string | undefined;
    if (data.nuevaContraseña !== undefined) {
      const admin = await this.authRepository.findAdminCredentialsById(id);
      if (!admin) {
        throw new UnauthorizedException('Administrador no encontrado');
      }

      const isPasswordValid = await bcrypt.compare(
        data.contraseñaActual!,
        admin.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('La contraseña actual es incorrecta');
      }

      passwordHash = await bcrypt.hash(data.nuevaContraseña, 12);
    }

    await this.authRepository.updateAdminProfile(id, {
      nombre: data.nombre?.trim(),
      correo: data.correo?.trim().toLowerCase(),
      nombreEmpresa: data.nombreEmpresa?.trim(),
      passwordHash,
    });

    const profile = await this.authRepository.findAdminProfileById(id);
    if (!profile) {
      throw new UnauthorizedException('Administrador no encontrado');
    }

    return profile;
  }
}