import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';

export interface MobileProfileResult {
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
  puntosTotales: number;
  leccionesCompletadas: number;
  leccionesPendientes: number;
  medallasObtenidas: number;
  posicionRanking: number;
}

@Injectable()
export class GetMobileProfileUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(usuarioId: string): Promise<MobileProfileResult> {
    const user = await this.mobileRepository.findUserById(usuarioId);
    if (!user || user.estado !== 'activo') {
      throw new NotFoundException('Colaborador no encontrado o inactivo.');
    }

    const metrics = await this.mobileRepository.getEmployeeMetrics(user.id, user.empresaId);

    return {
      id: user.id,
      nombre: user.nombre,
      correoCorporativo: user.correoCorporativo,
      numeroTelefonico: user.numeroTelefonico,
      scoreRiesgo: user.scoreRiesgo,
      rachaDiasSeguros: user.rachaDiasSeguros,
      pushHabilitado: user.pushHabilitado,
      departamento: user.departamentoNombre || null,
      empresa: {
        id: user.empresaId,
        nombre: user.empresaNombre || 'Organización',
      },
      puntosTotales: metrics.puntosTotales,
      leccionesCompletadas: metrics.leccionesCompletadas,
      leccionesPendientes: metrics.leccionesPendientes,
      medallasObtenidas: metrics.medallasObtenidas,
      posicionRanking: metrics.posicionRanking,
    };
  }
}
