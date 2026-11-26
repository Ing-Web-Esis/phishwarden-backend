export const SIMULATION_TRACKING_REPOSITORY_PORT =
  'SIMULATION_TRACKING_REPOSITORY_PORT';

export interface PortalConfigData {
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

export interface TrackingParticipantDetail {
  tokenRastreo: string;
  campanaId: string;
  campanaNombre: string;
  campanaEstado: string;
  plantillaId: number;
  plantillaTitulo: string;
  plantillaAsunto: string | null;
  plantillaCuerpoHtml: string;
  plantillaMetodoAtaque: string;
  plantillaIndicadorDificultad: string | null;
  plantillaLandingTipo: string | null;
  plantillaLandingId?: number | null;
  portalConfig?: PortalConfigData | null;
  usuarioId: string;
  usuarioNombre: string;
  usuarioCorreo: string;
  usuarioPushToken?: string | null;
  usuarioScoreRiesgo: number;
  usuarioRachaDias: number;
  empresaId: number;
  empresaNombre: string;
}

export interface DispatchTargetParticipant {
  usuarioId: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  tokenRastreo: string;
}

export interface CampaignDispatchInfo {
  id: string;
  nombre: string;
  empresaId: number;
  empresaNombre: string;
  modalidadEnvio: string;
  metodoAtaque: string;
  asunto: string;
  cuerpoHtml: string;
  targets: DispatchTargetParticipant[];
}

export interface SimulationTrackingRepositoryPort {
  findParticipantByToken(token: string): Promise<TrackingParticipantDetail | null>;

  hasEvent(campanaId: string, usuarioId: string, tipoEvento: string): Promise<boolean>;

  recordEvent(data: {
    campanaId: string;
    usuarioId: string;
    tipoEvento: string;
    ipAnonimizada?: string;
    userAgent?: string;
  }): Promise<void>;

  updateUserRisk(
    usuarioId: string,
    scoreRiesgo: number,
    rachaDiasSeguros: number,
  ): Promise<void>;

  findPendingScheduledCampaignIds(now: Date): Promise<string[]>;

  lockAndTransitionCampaignToInCourse(
    campaignId: string,
    companyId?: number,
  ): Promise<{ success: boolean; campaign?: CampaignDispatchInfo }>;

  recordDispatchEvents(
    events: Array<{ campanaId: string; usuarioId: string; tipoEvento: string }>,
  ): Promise<void>;

  finalizeExpiredInCourseCampaigns(cutoffDate: Date): Promise<number>;
}
