import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';

export interface VincularMobileCommand {
  correoCorporativo: string;
  codigoAcceso: string;
}

export interface VincularMobileResult {
  message: string;
  accessToken: string;
  usuario: {
    id: string;
    nombre: string;
    correoCorporativo: string;
    numeroTelefonico: string | null;
    scoreRiesgo: number;
    rachaDiasSeguros: number;
    pushHabilitado: boolean;
    departamento: string | null;
    empresa: {
      id: number;
      nombre: string;
    };
  };
}

@Injectable()
export class VincularMobileUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: VincularMobileCommand): Promise<VincularMobileResult> {
    const cleanEmail = command.correoCorporativo.trim().toLowerCase();
    const cleanAccessCode = command.codigoAcceso.trim().toUpperCase();

    // 1. Validar que la empresa exista y coincida con el código de acceso
    const company = await this.mobileRepository.findCompanyByAccessCode(cleanAccessCode);
    if (!company) {
      throw new UnauthorizedException('Código de acceso de organización inválido o inexistente.');
    }

    // 2. Validar que el usuario pertenezca a la empresa y se encuentre activo
    const user = await this.mobileRepository.findActiveUserByEmailAndCompany(cleanEmail, company.id);
    if (!user) {
      throw new UnauthorizedException(
        'El correo corporativo no pertenece a esta organización o no se encuentra activo.',
      );
    }

    // 3. Emitir token JWT con rol exclusivo EMPLOYEE
    const payload = {
      sub: user.id,
      usuarioId: user.id,
      empresaId: company.id,
      correo: user.correoCorporativo,
      role: 'EMPLOYEE',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '30d',
    });

    return {
      message: 'Dispositivo móvil vinculado exitosamente.',
      accessToken,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        correoCorporativo: user.correoCorporativo,
        numeroTelefonico: user.numeroTelefonico,
        scoreRiesgo: user.scoreRiesgo,
        rachaDiasSeguros: user.rachaDiasSeguros,
        pushHabilitado: user.pushHabilitado,
        departamento: user.departamentoNombre || null,
        empresa: {
          id: company.id,
          nombre: company.nombre,
        },
      },
    };
  }
}
