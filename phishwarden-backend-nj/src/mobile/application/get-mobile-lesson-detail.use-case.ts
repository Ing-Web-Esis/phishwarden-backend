import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';
import type { LessonDetailEntity } from '../domain/mobile-lesson.entity';

@Injectable()
export class GetMobileLessonDetailUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(lessonId: number, userId: string): Promise<LessonDetailEntity> {
    const lesson = await this.mobileRepository.findLessonDetailById(lessonId, userId);
    if (!lesson) {
      throw new NotFoundException(`La microlección con ID ${lessonId} no existe.`);
    }
    return lesson;
  }
}
