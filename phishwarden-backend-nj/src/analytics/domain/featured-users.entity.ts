import type { RiskLevel } from './executive-summary.entity';

export class HighRiskUserEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly correo: string,
    public readonly departamento: string,
    public readonly scoreRiesgo: number,
    public readonly nivelRiesgo: RiskLevel,
    public readonly simulacionesFallidas: number,
  ) {}
}

export class TopDefenderUserEntity {
  constructor(
    public readonly id: string,
    public readonly nombre: string,
    public readonly correo: string,
    public readonly departamento: string,
    public readonly puntosCapacitacion: number,
    public readonly reportesRealizados: number,
    public readonly scoreRiesgo: number,
    public readonly rachaDiasSeguros: number,
  ) {}
}

export class FeaturedUsersEntity {
  constructor(
    public readonly mayorRiesgo: HighRiskUserEntity[],
    public readonly mejoresDefensores: TopDefenderUserEntity[],
  ) {}
}
