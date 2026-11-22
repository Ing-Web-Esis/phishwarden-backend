import { Injectable, Logger } from '@nestjs/common';
import type {
  SimulationAlertHookPort,
  CompromisedAlertInput,
} from '../application/simulation-alert-hook.port';

@Injectable()
export class LoggingAlertHookAdapter implements SimulationAlertHookPort {
  private readonly logger = new Logger(LoggingAlertHookAdapter.name);

  async notifyCompromisedUser(input: CompromisedAlertInput): Promise<void> {
    this.logger.warn(
      `[SECURITY ALERT HOOK] Colaborador comprometido: ${input.nombreUsuario} (${input.correoUsuario}) en Campaña ${input.campanaId} [Ataque: ${input.tipoAtaque}] - Fecha: ${input.fechaHora.toISOString()}`,
    );
  }
}
