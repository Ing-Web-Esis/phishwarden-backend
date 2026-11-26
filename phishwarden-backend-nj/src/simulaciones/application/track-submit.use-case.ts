import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import {
  SIMULATION_TRACKING_REPOSITORY_PORT,
} from './simulation-tracking.repository.port';
import type {
  SimulationTrackingRepositoryPort,
} from './simulation-tracking.repository.port';
import {
  SIMULATION_ALERT_HOOK_PORT,
} from './simulation-alert-hook.port';
import type {
  SimulationAlertHookPort,
} from './simulation-alert-hook.port';
import { PUSH_NOTIFICATION_PORT } from '../../mobile/application/push-notification.port';
import type { PushNotificationPort } from '../../mobile/application/push-notification.port';
import { AssignReactiveLessonUseCase } from '../../mobile/application/assign-reactive-lesson.use-case';
import { SimulationEventType } from '../domain/simulation-event-type.enum';
import { RiskScoreCalculator } from '../domain/risk-score-calculator.service';
import { LandingInferenceService } from '../domain/landing-inference.service';

export interface EducationalFeedbackResult {
  status: 'compromised';
  message: string;
  landingTipo: string;
  recomendaciones: string[];
}

@Injectable()
export class TrackSubmitUseCase {
  private readonly logger = new Logger(TrackSubmitUseCase.name);

  constructor(
    @Inject(SIMULATION_TRACKING_REPOSITORY_PORT)
    private readonly trackingRepository: SimulationTrackingRepositoryPort,
    @Inject(SIMULATION_ALERT_HOOK_PORT)
    private readonly alertHook: SimulationAlertHookPort,
    @Inject(PUSH_NOTIFICATION_PORT)
    private readonly pushNotificationPort: PushNotificationPort,
    private readonly assignReactiveLessonUseCase: AssignReactiveLessonUseCase,
  ) {}

  async execute(
    token: string,
    ipAnonimizada?: string,
    userAgent?: string,
  ): Promise<EducationalFeedbackResult> {
    const participant = await this.trackingRepository.findParticipantByToken(token);

    if (
      !participant ||
      participant.campanaEstado === 'cancelada' ||
      participant.campanaEstado === 'finalizada'
    ) {
      throw new NotFoundException('La simulación solicitada no existe o no se encuentra disponible.');
    }

    const alreadyRecorded = await this.trackingRepository.hasEvent(
      participant.campanaId,
      participant.usuarioId,
      SimulationEventType.FORMULARIO_ENVIADO,
    );

    if (!alreadyRecorded) {
      await this.trackingRepository.recordEvent({
        campanaId: participant.campanaId,
        usuarioId: participant.usuarioId,
        tipoEvento: SimulationEventType.FORMULARIO_ENVIADO,
        ipAnonimizada,
        userAgent,
      });

      const riskResult = RiskScoreCalculator.calculate(
        participant.usuarioScoreRiesgo,
        participant.usuarioRachaDias,
        SimulationEventType.FORMULARIO_ENVIADO,
      );

      await this.trackingRepository.updateUserRisk(
        participant.usuarioId,
        riskResult.newScore,
        riskResult.newStreak,
      );

      // Disparar hook de alerta
      await this.alertHook.notifyCompromisedUser({
        usuarioId: participant.usuarioId,
        campanaId: participant.campanaId,
        tipoAtaque: participant.plantillaMetodoAtaque,
        nombreUsuario: participant.usuarioNombre,
        correoUsuario: participant.usuarioCorreo,
        fechaHora: new Date(),
      });

      // Envío asíncrono no bloqueante de alerta push FCM a la aplicación móvil
      if (participant.usuarioPushToken) {
        this.pushNotificationPort
          .sendPush({
            token: participant.usuarioPushToken,
            title: '🚨 Alerta Crítica: Credenciales enviadas en simulación',
            body: `Hola ${participant.usuarioNombre}, detectamos el envío de datos en un formulario de prueba. Tu score de riesgo ha aumentado.`,
            data: {
              tipoAlerta: 'SIMULATION_SUBMIT',
              campanaId: String(participant.campanaId),
              metodoAtaque: String(participant.plantillaMetodoAtaque),
              fechaHora: new Date().toISOString(),
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            },
          })
          .catch((pushErr) => {
            this.logger.error(
              `Error no bloqueante enviando push de simulación (submit) a ${participant.usuarioId}:`,
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

      this.logger.warn(
        `Alerta de seguridad: Colaborador ${participant.usuarioCorreo} envió credenciales en simulación (Campaña: ${participant.campanaId}, Score: ${participant.usuarioScoreRiesgo} -> ${riskResult.newScore})`,
      );
    }

    const resolvedLanding = LandingInferenceService.infer(
      participant.plantillaLandingTipo,
      participant.plantillaTitulo,
      participant.plantillaAsunto,
    );

    return {
      status: 'compromised',
      message:
        'Simulación detectada: Has ingresado credenciales en una prueba de concientización de seguridad de tu organización.',
      landingTipo: resolvedLanding,
      recomendaciones: [
        'Verifica siempre la URL y el certificado SSL del sitio antes de ingresar tus contraseñas.',
        'Nunca proporciones tus credenciales corporativas en enlaces recibidos por correos o SMS imprevistos.',
        'Comunícate inmediatamente con el área de TI o Ciberseguridad de tu organización ante cualquier sospecha.',
      ],
    };
  }
}
