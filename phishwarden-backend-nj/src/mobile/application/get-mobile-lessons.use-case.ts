import { Injectable, Inject } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';
import type { LessonSummaryEntity } from '../domain/mobile-lesson.entity';

export interface MobileLessonsGroupedResult {
  asignadasPendientes: LessonSummaryEntity[];
  catalogoDisponible: LessonSummaryEntity[];
  completadas: LessonSummaryEntity[];
}

@Injectable()
export class GetMobileLessonsUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(userId: string): Promise<MobileLessonsGroupedResult> {
    const all = await this.mobileRepository.findAllLessonsWithUserStatus(userId);

    const asignadasPendientes: LessonSummaryEntity[] = [];
    const catalogoDisponible: LessonSummaryEntity[] = [];
    const completadas: LessonSummaryEntity[] = [];

    for (const lesson of all) {
      if (lesson.estado === 'completada') {
        completadas.push(lesson);
      } else if (lesson.estado === 'pendiente' || lesson.estado === 'reprobada') {
        asignadasPendientes.push(lesson);
      } else {
        catalogoDisponible.push(lesson);
      }
    }

    return {
      asignadasPendientes,
      catalogoDisponible,
      completadas,
    };
  }
}
