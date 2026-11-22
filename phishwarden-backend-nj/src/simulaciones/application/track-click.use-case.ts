import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SIMULATION_TRACKING_REPOSITORY_PORT,
} from './simulation-tracking.repository.port';
import type {
  SimulationTrackingRepositoryPort,
} from './simulation-tracking.repository.port';
import { PUSH_NOTIFICATION_PORT } from '../../mobile/application/push-notification.port';
import type { PushNotificationPort } from '../../mobile/application/push-notification.port';
import { AssignReactiveLessonUseCase } from '../../mobile/application/assign-reactive-lesson.use-case';
import { SimulationEventType } from '../domain/simulation-event-type.enum';
import { RiskScoreCalculator } from '../domain/risk-score-calculator.service';

@Injectable()
export class TrackClickUseCase {
  private readonly logger = new Logger(TrackClickUseCase.name);

  constructor(
    @Inject(SIMULATION_TRACKING_REPOSITORY_PORT)
    private readonly trackingRepository: SimulationTrackingRepositoryPort,
    @Inject(PUSH_NOTIFICATION_PORT)
    private readonly pushNotificationPort: PushNotificationPort,
    private readonly assignReactiveLessonUseCase: AssignReactiveLessonUseCase,
  ) {}

  async execute(token: string, ipAnonimizada?: string, userAgent?: string): Promise<string> {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3001').replace(/\/+$/, '');
    const fallbackRedirect = `${frontendUrl}/login`;

    try {
      const participant = await this.trackingRepository.findParticipantByToken(token);

      if (
        !participant ||
        participant.campanaEstado === 'cancelada' ||
        participant.campanaEstado === 'finalizada'
      ) {
        return fallbackRedirect;
      }

      const alreadyRecorded = await this.trackingRepository.hasEvent(
        participant.campanaId,
        participant.usuarioId,
        SimulationEventType.CLICK,
      );

      if (!alreadyRecorded) {
        await this.trackingRepository.recordEvent({
          campanaId: participant.campanaId,
          usuarioId: participant.usuarioId,
          tipoEvento: SimulationEventType.CLICK,
          ipAnonimizada,
          userAgent,
        });

        const riskResult = RiskScoreCalculator.calculate(
          participant.usuarioScoreRiesgo,
          participant.usuarioRachaDias,
          SimulationEventType.CLICK,
        );

        await this.trackingRepository.updateUserRisk(
          participant.usuarioId,
          riskResult.newScore,
          riskResult.newStreak,
        );

        // Envío asíncrono no bloqueante de alerta push FCM a la aplicación móvil
        if (participant.usuarioPushToken) {
          this.pushNotificationPort
            .sendPush({
              token: participant.usuarioPushToken,
              title: '⚠️ Alerta de Seguridad: Clic en enlace sospechoso',
              body: `Hola ${participant.usuarioNombre}, detectamos que hiciste clic en un enlace de simulación. Revisa la aplicación móvil para más detalles.`,
              data: {
                tipoAlerta: 'SIMULATION_CLICK',
                campanaId: String(participant.campanaId),
                metodoAtaque: String(participant.plantillaMetodoAtaque),
                fechaHora: new Date().toISOString(),
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              },
            })
            .catch((pushErr) => {
              this.logger.error(
                `Error no bloqueante enviando push de simulación (clic) a ${participant.usuarioId}:`,
                pushErr,
              );
            });
        }

        // Asignación asíncrona no bloqueante de microlección reactiva al colaborador
        this.assignReactiveLessonUseCase
          .execute(participant.usuarioId, participant.plantillaMetodoAtaque)
          .catch((lessonErr) => {
            this.logger.error(
              `Error no bloqueante asignando microlección reactiva a ${participant.usuarioId}:`,
              lessonErr,
            );
          });

        this.logger.log(
          `Clic registrado en enlace de simulación (Campaña: ${participant.campanaId}, Usuario: ${participant.usuarioCorreo}, Score: ${participant.usuarioScoreRiesgo} -> ${riskResult.newScore})`,
        );
      }

      return `${frontendUrl}/sim/verificar?t=${token}`;
    } catch (error) {
      this.logger.error(`Error al procesar clic de simulación (${token}):`, error);
      return fallbackRedirect;
    }
  }
}
