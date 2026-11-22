import { SimulationEventType } from './simulation-event-type.enum';

export interface RiskCalculationResult {
  newScore: number;
  newStreak: number;
  scoreDelta: number;
}

export class RiskScoreCalculator {
  /**
   * Calcula el nuevo score de riesgo del colaborador asegurando los límites 0-100
   * exigidos por el CHECK constraint de la base de datos (CHECK (score_riesgo BETWEEN 0 AND 100)).
   */
  static calculate(
    currentScore: number,
    currentStreak: number,
    eventType: SimulationEventType,
  ): RiskCalculationResult {
    let delta = 0;
    let newStreak = currentStreak;

    switch (eventType) {
      case SimulationEventType.CLICK:
        delta = 15;
        newStreak = 0;
        break;
      case SimulationEventType.FORMULARIO_ENVIADO:
        delta = 30;
        newStreak = 0;
        break;
      case SimulationEventType.ABIERTO:
      case SimulationEventType.ENVIADO:
      case SimulationEventType.DESCARGA_ADJUNTO:
      default:
        delta = 0;
        break;
    }

    const safeScore = currentScore ?? 0;
    const newScore = Math.min(100, Math.max(0, safeScore + delta));

    return {
      newScore,
      newStreak,
      scoreDelta: delta,
    };
  }
}
