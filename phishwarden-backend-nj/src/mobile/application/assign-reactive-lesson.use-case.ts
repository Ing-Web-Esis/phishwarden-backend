import { Injectable, Inject, Logger } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';

@Injectable()
export class AssignReactiveLessonUseCase {
  private readonly logger = new Logger(AssignReactiveLessonUseCase.name);

  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(userId: string, metodoAtaque: string): Promise<number | null> {
    try {
      const assignedLessonId = await this.mobileRepository.assignReactiveLessonIfEligible(
        userId,
        metodoAtaque,
      );

      if (assignedLessonId) {
        this.logger.log(
          `Microlección reactiva ID ${assignedLessonId} asignada al usuario ${userId} tras simulación (${metodoAtaque}).`,
        );
      }
      return assignedLessonId;
    } catch (error) {
      this.logger.error(
        `Error al asignar microlección reactiva a ${userId} (${metodoAtaque}):`,
        error,
      );
      return null;
    }
  }
}
