import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SIMULATION_TRACKING_REPOSITORY_PORT,
} from './simulation-tracking.repository.port';
import type {
  SimulationTrackingRepositoryPort,
} from './simulation-tracking.repository.port';
import { SimulationEventType } from '../domain/simulation-event-type.enum';

// Buffer GIF 1x1 transparente estándar de 43 bytes
export const TRANSPARENT_GIF_1X1 = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

@Injectable()
export class TrackOpenUseCase {
  private readonly logger = new Logger(TrackOpenUseCase.name);

  constructor(
    @Inject(SIMULATION_TRACKING_REPOSITORY_PORT)
    private readonly trackingRepository: SimulationTrackingRepositoryPort,
  ) {}

  async execute(token: string, ipAnonimizada?: string, userAgent?: string) {
    try {
      const participant = await this.trackingRepository.findParticipantByToken(
        token,
      );

      if (
        !participant ||
        participant.campanaEstado === 'cancelada' ||
        participant.campanaEstado === 'finalizada'
      ) {
        return TRANSPARENT_GIF_1X1;
      }

      const alreadyRecorded = await this.trackingRepository.hasEvent(
        participant.campanaId,
        participant.usuarioId,
        SimulationEventType.ABIERTO,
      );

      if (!alreadyRecorded) {
        await this.trackingRepository.recordEvent({
          campanaId: participant.campanaId,
          usuarioId: participant.usuarioId,
          tipoEvento: SimulationEventType.ABIERTO,
          ipAnonimizada,
          userAgent,
        });

        this.logger.log(
          `Apertura de correo registrada (Campaña: ${participant.campanaId}, Usuario: ${participant.usuarioCorreo})`,
        );
      }
    } catch (error) {
      this.logger.error(`Error al procesar apertura de rastreo (${token}):`, error);
    }

    return TRANSPARENT_GIF_1X1;
  }
}
