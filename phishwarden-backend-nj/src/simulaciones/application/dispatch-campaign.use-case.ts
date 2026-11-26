import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  SIMULATION_TRACKING_REPOSITORY_PORT,
} from './simulation-tracking.repository.port';
import type {
  SimulationTrackingRepositoryPort,
} from './simulation-tracking.repository.port';
import { EMAIL_SENDER_PORT } from './email-sender.port';
import type { EmailSenderPort } from './email-sender.port';
import { SMS_SENDER_PORT } from './sms-sender.port';
import type { SmsSenderPort } from './sms-sender.port';
import { TemplateInterpolatorService } from '../domain/template-interpolator.service';
import { SimulationEventType } from '../domain/simulation-event-type.enum';

@Injectable()
export class DispatchCampaignUseCase {
  private readonly logger = new Logger(DispatchCampaignUseCase.name);

  constructor(
    @Inject(SIMULATION_TRACKING_REPOSITORY_PORT)
    private readonly trackingRepository: SimulationTrackingRepositoryPort,
    @Inject(EMAIL_SENDER_PORT)
    private readonly emailSender: EmailSenderPort,
    @Inject(SMS_SENDER_PORT)
    private readonly smsSender: SmsSenderPort,
  ) {}

  async execute(campaignId: string, companyId?: number) {
    this.logger.log(
      `Iniciando despacho atómico para campaña ${campaignId} ${
        companyId ? `(Tenant: ${companyId})` : '(Cron Scheduler)'
      }`,
    );

    // Bloqueo atómico y transición a 'en_curso'
    const lockResult =
      await this.trackingRepository.lockAndTransitionCampaignToInCourse(
        campaignId,
        companyId,
      );

    if (!lockResult.success || !lockResult.campaign) {
      if (companyId) {
        throw new NotFoundException(
          'La campaña no fue encontrada o no se encuentra en estado programada para su despacho.',
        );
      }
      this.logger.warn(
        `Campaña ${campaignId} omitida: ya fue tomada o no está en estado programada.`,
      );
      return null;
    }

    const campaign = lockResult.campaign;
    const dispatchMode = (process.env.DISPATCH_MODE || 'sandbox').toLowerCase();
    const backendPublicUrl =
      process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000';
    const isEscalonado = campaign.modalidadEnvio === 'escalonado';

    this.logger.log(
      `Despachando campaña "${campaign.nombre}" (${campaign.targets.length} destinatarios, Modo: ${dispatchMode}, Modalidad: ${campaign.modalidadEnvio})`,
    );

    const isSmishing = campaign.metodoAtaque?.toLowerCase() === 'smishing';
    const dispatchEventsToRecord: Array<{
      campanaId: string;
      usuarioId: string;
      tipoEvento: string;
    }> = [];

    // Procesar envío de mensajes
    for (let i = 0; i < campaign.targets.length; i++) {
      const target = campaign.targets[i];

      const renderedBody = TemplateInterpolatorService.interpolate(
        campaign.cuerpoHtml,
        {
          nombre: target.nombre,
          correo: target.correo,
          empresa: campaign.empresaNombre,
          token: target.tokenRastreo,
          backendPublicUrl,
        },
      );

      try {
        if (isSmishing) {
          if (!target.telefono) {
            this.logger.warn(
              `Destinatario ${target.nombre} (${target.correo}) omitido de SMS: no tiene teléfono registrado.`,
            );
          } else {
            await this.smsSender.sendSms({
              to: target.telefono,
              body: `${campaign.asunto}: ${backendPublicUrl}/track/click/${target.tokenRastreo}`,
            });
            dispatchEventsToRecord.push({
              campanaId: campaign.id,
              usuarioId: target.usuarioId,
              tipoEvento: SimulationEventType.ENVIADO,
            });
          }
        } else {
          // Phishing vía Email
          await this.emailSender.sendEmail({
            to: target.correo,
            subject: campaign.asunto,
            html: renderedBody,
          });
          dispatchEventsToRecord.push({
            campanaId: campaign.id,
            usuarioId: target.usuarioId,
            tipoEvento: SimulationEventType.ENVIADO,
          });
        }
      } catch (sendError) {
        this.logger.error(
          `Error al despachar a ${target.correo} (Campaña: ${campaign.id}):`,
          sendError,
        );
      }

      // Si es escalonado y no es el último registro, introducir micro-pausa controlada
      if (isEscalonado && i < campaign.targets.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Registrar eventos de envío en lote
    if (dispatchEventsToRecord.length > 0) {
      await this.trackingRepository.recordDispatchEvents(dispatchEventsToRecord);
    }

    this.logger.log(
      `Despacho completado exitosamente para campaña "${campaign.nombre}" (${dispatchEventsToRecord.length} enviados)`,
    );

    return {
      message: 'Campaña despachada exitosamente.',
      campaignId: campaign.id,
      totalTargets: campaign.targets.length,
      mode: dispatchMode,
    };
  }
}
