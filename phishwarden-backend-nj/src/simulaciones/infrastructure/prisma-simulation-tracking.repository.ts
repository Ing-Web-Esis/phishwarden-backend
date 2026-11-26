import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  SimulationTrackingRepositoryPort,
  TrackingParticipantDetail,
  CampaignDispatchInfo,
  DispatchTargetParticipant,
  PortalConfigData,
} from '../application/simulation-tracking.repository.port';
import { LandingInferenceService } from '../domain/landing-inference.service';

@Injectable()
export class PrismaSimulationTrackingRepository
  implements SimulationTrackingRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findParticipantByToken(
    token: string,
  ): Promise<TrackingParticipantDetail | null> {
    const record = await (this.prisma as any).campana_usuarios.findFirst({
      where: { token_rastreo: token },
      include: {
        campanas: {
          include: {
            plantillas: {
              include: {
                empresas: true,
                portales_simulados: true,
              },
            },
          },
        },
        usuarios: {
          include: { empresas: true },
        },
      },
    });

    if (!record || !record.campanas || !record.usuarios) {
      return null;
    }

    const c = record.campanas;
    const p = c.plantillas;
    const u = record.usuarios;
    const emp = p?.empresas || u?.empresas;

    let portalConfig: PortalConfigData | null = null;
    if (p?.portales_simulados) {
      const ps = p.portales_simulados;
      portalConfig = {
        id: ps.id,
        nombre: ps.nombre,
        tipoBase: ps.tipo_base,
        tituloPortal: ps.titulo_portal,
        subtitulo: ps.subtitulo ?? null,
        logoUrl: ps.logo_url ?? null,
        colorPrimario: ps.color_primario,
        colorFondo: ps.color_fondo,
        labelUsuario: ps.label_usuario,
        labelPassword: ps.label_password,
        textoBoton: ps.texto_boton,
      };
    } else {
      const resolvedType = LandingInferenceService.infer(
        p?.landing_tipo,
        p?.titulo,
        p?.asunto,
      );
      const globalPortal = await (this.prisma as any).portales_simulados.findFirst({
        where: {
          tipo_base: resolvedType,
          empresa_id: null,
        },
      });

      if (globalPortal) {
        portalConfig = {
          id: globalPortal.id,
          nombre: globalPortal.nombre,
          tipoBase: globalPortal.tipo_base,
          tituloPortal: globalPortal.titulo_portal,
          subtitulo: globalPortal.subtitulo ?? null,
          logoUrl: globalPortal.logo_url ?? null,
          colorPrimario: globalPortal.color_primario,
          colorFondo: globalPortal.color_fondo,
          labelUsuario: globalPortal.label_usuario,
          labelPassword: globalPortal.label_password,
          textoBoton: globalPortal.texto_boton,
        };
      }
    }

    return {
      tokenRastreo: record.token_rastreo,
      campanaId: c.id,
      campanaNombre: c.nombre,
      campanaEstado: c.estado || 'programada',
      plantillaId: p?.id || 0,
      plantillaTitulo: p?.titulo || 'Plantilla de Simulación',
      plantillaAsunto: p?.asunto || null,
      plantillaCuerpoHtml: p?.cuerpo_html || '',
      plantillaMetodoAtaque: p?.metodo_ataque || 'phishing',
      plantillaIndicadorDificultad: p?.indicador_dificultad || null,
      plantillaLandingTipo: p?.landing_tipo || null,
      plantillaLandingId: p?.landing_id ?? null,
      portalConfig,
      usuarioId: u.id,
      usuarioNombre: u.nombre,
      usuarioCorreo: u.correo_corporativo,
      usuarioPushToken: u.token_notificacion_push || null,
      usuarioScoreRiesgo: u.score_riesgo ?? 0,
      usuarioRachaDias: u.racha_dias_seguros ?? 0,
      empresaId: emp?.id || 0,
      empresaNombre: emp?.nombre || 'Mi Organización',
    };
  }

  async hasEvent(
    campanaId: string,
    usuarioId: string,
    tipoEvento: string,
  ): Promise<boolean> {
    const count = await (this.prisma as any).eventos_simulacion.count({
      where: {
        campana_id: campanaId,
        usuario_id: usuarioId,
        tipo_evento: tipoEvento,
      },
    });
    return count > 0;
  }

  async recordEvent(data: {
    campanaId: string;
    usuarioId: string;
    tipoEvento: string;
    ipAnonimizada?: string;
    userAgent?: string;
  }): Promise<void> {
    await (this.prisma as any).eventos_simulacion.create({
      data: {
        campana_id: data.campanaId,
        usuario_id: data.usuarioId,
        tipo_evento: data.tipoEvento,
        ip_anonimizada: data.ipAnonimizada || null,
        user_agent: data.userAgent || null,
      },
    });
  }

  async updateUserRisk(
    usuarioId: string,
    scoreRiesgo: number,
    rachaDiasSeguros: number,
  ): Promise<void> {
    await (this.prisma as any).usuarios.update({
      where: { id: usuarioId },
      data: {
        score_riesgo: scoreRiesgo,
        racha_dias_seguros: rachaDiasSeguros,
      },
    });
  }

  async findPendingScheduledCampaignIds(now: Date): Promise<string[]> {
    const campaigns = await (this.prisma as any).campanas.findMany({
      where: {
        estado: 'programada',
        fecha_programada: { lte: now },
      },
      select: { id: true },
      orderBy: { fecha_programada: 'asc' },
    });
    return campaigns.map((c: any) => c.id);
  }

  async lockAndTransitionCampaignToInCourse(
    campaignId: string,
    companyId?: number,
  ): Promise<{ success: boolean; campaign?: CampaignDispatchInfo }> {
    const campaign = await (this.prisma as any).campanas.findUnique({
      where: { id: campaignId },
      include: {
        plantillas: {
          include: { empresas: true },
        },
        campana_usuarios: {
          include: {
            usuarios: true,
          },
        },
      },
    });

    if (!campaign) {
      return { success: false };
    }

    const campaignCompanyId =
      campaign.plantillas?.empresa_id ?? campaign.plantillas?.empresas?.id;

    if (companyId !== undefined && campaignCompanyId !== companyId) {
      return { success: false };
    }

    // Transición atómica de estado para prevenir condiciones de carrera
    const updateResult = await (this.prisma as any).campanas.updateMany({
      where: {
        id: campaignId,
        estado: 'programada',
      },
      data: {
        estado: 'en_curso',
      },
    });

    if (updateResult.count === 0) {
      return { success: false };
    }

    const targets: DispatchTargetParticipant[] = (
      campaign.campana_usuarios || []
    ).map((cu: any) => ({
      usuarioId: cu.usuario_id,
      nombre: cu.usuarios?.nombre || 'Colaborador',
      correo: cu.usuarios?.correo_corporativo || '',
      telefono: cu.usuarios?.numero_telefonico || null,
      tokenRastreo: cu.token_rastreo,
    }));

    const dispatchInfo: CampaignDispatchInfo = {
      id: campaign.id,
      nombre: campaign.nombre,
      empresaId: campaignCompanyId || 0,
      empresaNombre: campaign.plantillas?.empresas?.nombre || 'Mi Organización',
      modalidadEnvio: campaign.modalidad_envio || 'masivo',
      metodoAtaque: campaign.plantillas?.metodo_ataque || 'phishing',
      asunto: campaign.plantillas?.asunto || 'Aviso de Seguridad',
      cuerpoHtml: campaign.plantillas?.cuerpo_html || '',
      targets,
    };

    return { success: true, campaign: dispatchInfo };
  }

  async recordDispatchEvents(
    events: Array<{ campanaId: string; usuarioId: string; tipoEvento: string }>,
  ): Promise<void> {
    if (events.length === 0) return;
    await (this.prisma as any).eventos_simulacion.createMany({
      data: events.map((e) => ({
        campana_id: e.campanaId,
        usuario_id: e.usuarioId,
        tipo_evento: e.tipoEvento,
      })),
    });
  }

  async finalizeExpiredInCourseCampaigns(cutoffDate: Date): Promise<number> {
    const result = await (this.prisma as any).campanas.updateMany({
      where: {
        estado: 'en_curso',
        fecha_programada: { lte: cutoffDate },
      },
      data: {
        estado: 'finalizada',
      },
    });

    return result.count;
  }
}
