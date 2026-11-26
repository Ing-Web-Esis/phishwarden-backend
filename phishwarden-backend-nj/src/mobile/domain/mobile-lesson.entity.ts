export type LessonStatus = 'disponible' | 'pendiente' | 'reprobada' | 'completada';

export class EvaluationQuestionEntity {
  constructor(
    public readonly id: number,
    public readonly enunciado: string,
    public readonly opcionA: string,
    public readonly opcionB: string,
    public readonly opcionC: string,
    public readonly opcionD: string,
    public readonly respuestaCorrecta?: string,
  ) {}
}

export class LessonSummaryEntity {
  constructor(
    public readonly id: number,
    public readonly titulo: string,
    public readonly metodoAtaque: string,
    public readonly contenidoMultimedia: string | null,
    public readonly duracionMinutos: number,
    public readonly puntosRecompensa: number,
    public readonly estado: LessonStatus,
    public readonly puntosObtenidos?: number,
    public readonly fechaCompletado?: Date | null,
  ) {}
}

export class LessonDetailEntity {
  constructor(
    public readonly id: number,
    public readonly titulo: string,
    public readonly metodoAtaque: string,
    public readonly contenidoMultimedia: string | null,
    public readonly duracionMinutos: number,
    public readonly puntosRecompensa: number,
    public readonly estadoUsuario: LessonStatus,
    public readonly preguntas: EvaluationQuestionEntity[],
  ) {}
}
