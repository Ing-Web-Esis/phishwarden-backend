export const SIMULATION_ALERT_HOOK_PORT = 'SIMULATION_ALERT_HOOK_PORT';

export interface CompromisedAlertInput {
  usuarioId: string;
  campanaId: string;
  tipoAtaque: string;
  nombreUsuario: string;
  correoUsuario: string;
  fechaHora: Date;
}

export interface SimulationAlertHookPort {
  notifyCompromisedUser(input: CompromisedAlertInput): Promise<void>;
}
