import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  SIMULATION_TRACKING_REPOSITORY_PORT,
} from './simulation-tracking.repository.port';
import type {
  SimulationTrackingRepositoryPort,
} from './simulation-tracking.repository.port';
import { LandingInferenceService } from '../domain/landing-inference.service';

export interface PortalConfigResult {
  id: number;
  nombre: string;
  tipoBase: string;
  tituloPortal: string;
  subtitulo: string | null;
  logoUrl: string | null;
  colorPrimario: string;
  colorFondo: string;
  labelUsuario: string;
  labelPassword: string;
  textoBoton: string;
}

export interface SimulationContextResult {
  token: string;
  landingTipo: string;
  metodoAtaque: string;
  nombreEmpresa: string;
  tituloPlantilla: string;
  asunto: string | null;
  indicadorDificultad: string | null;
  portalConfig?: PortalConfigResult | null;
}

@Injectable()
export class GetSimulationContextUseCase {
  constructor(
    @Inject(SIMULATION_TRACKING_REPOSITORY_PORT)
    private readonly trackingRepository: SimulationTrackingRepositoryPort,
  ) {}

  async execute(token: string): Promise<SimulationContextResult> {
    const participant = await this.trackingRepository.findParticipantByToken(token);

    if (
      !participant ||
      participant.campanaEstado === 'cancelada' ||
      participant.campanaEstado === 'finalizada'
    ) {
      throw new NotFoundException('La simulación solicitada no existe o no se encuentra disponible.');
    }

    const resolvedLanding = LandingInferenceService.infer(
      participant.plantillaLandingTipo,
      participant.plantillaTitulo,
      participant.plantillaAsunto,
    );

    return {
      token: participant.tokenRastreo,
      landingTipo: participant.portalConfig?.tipoBase || resolvedLanding,
      metodoAtaque: participant.plantillaMetodoAtaque,
      nombreEmpresa: participant.empresaNombre,
      tituloPlantilla: participant.plantillaTitulo,
      asunto: participant.plantillaAsunto,
      indicadorDificultad: participant.plantillaIndicadorDificultad,
      portalConfig: participant.portalConfig ?? null,
    };
  }
}
