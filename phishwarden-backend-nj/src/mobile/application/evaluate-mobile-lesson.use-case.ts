import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';
import type { EvaluationResultEntity } from '../domain/mobile-ranking.entity';

export interface AnswerInput {
  preguntaId: number;
  respuestaSeleccionada: 'A' | 'B' | 'C' | 'D';
}

@Injectable()
export class EvaluateMobileLessonUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(
    lessonId: number,
    userId: string,
    answers: AnswerInput[],
  ): Promise<EvaluationResultEntity> {
    const questions = await this.mobileRepository.findLessonQuestionsForEvaluation(lessonId);
    if (!questions) {
      throw new NotFoundException(`La microlección con ID ${lessonId} no existe.`);
    }

    if (questions.length === 0) {
      throw new BadRequestException('La microlección no cuenta con preguntas de evaluación activas.');
    }

    // Mapa de preguntas oficiales con su respuesta correcta
    const officialMap = new Map<number, string>();
    for (const q of questions) {
      officialMap.set(q.id, (q.respuestaCorrecta || '').toUpperCase());
    }

    // Deduplicar respuestas por preguntaId conservando la última respuesta ingresada
    const uniqueAnswers = new Map<number, string>();
    for (const ans of answers) {
      if (!officialMap.has(ans.preguntaId)) {
        throw new BadRequestException(
          `La pregunta con ID ${ans.preguntaId} no pertenece a esta microlección.`,
        );
      }
      uniqueAnswers.set(ans.preguntaId, (ans.respuestaSeleccionada || '').toUpperCase());
    }

    // Calificar respuestas en el servidor
    let correctas = 0;
    const totalPreguntas = questions.length;

    for (const [preguntaId, selectedOption] of uniqueAnswers.entries()) {
      const correctOption = officialMap.get(preguntaId);
      if (correctOption && selectedOption === correctOption) {
        correctas++;
      }
    }

    const porcentajeAciertos = Math.round((correctas / totalPreguntas) * 100);
    const aprobado = porcentajeAciertos >= 70;

    // Verificar si ya había sido completada previamente para aplicar anti-farming
    const existingAchievement = await this.mobileRepository.findUserLessonAchievement(userId, lessonId);
    const wasAlreadyCompleted = existingAchievement?.estado === 'completada';

    const lessonDetail = await this.mobileRepository.findLessonDetailById(lessonId, userId);
    const puntosRecompensa = lessonDetail?.puntosRecompensa ?? 10;

    // Ejecutar registro, cálculo de puntos, ajuste de riesgo y desbloqueo de medallas
    return await this.mobileRepository.evaluateAndRecordLesson({
      userId,
      lessonId,
      aprobado,
      correctas,
      totalPreguntas,
      porcentajeAciertos,
      puntosRecompensa,
      wasAlreadyCompleted,
    });
  }
}
