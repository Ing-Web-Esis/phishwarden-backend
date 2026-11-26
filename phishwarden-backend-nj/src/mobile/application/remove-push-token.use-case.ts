import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';

export interface RemovePushTokenResult {
  message: string;
  pushHabilitado: boolean;
}

@Injectable()
export class RemovePushTokenUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(usuarioId: string): Promise<RemovePushTokenResult> {
    const updated = await this.mobileRepository.updatePushToken(usuarioId, null);
    if (!updated) {
      throw new NotFoundException('Colaborador no encontrado para desvincular el token de notificación.');
    }

    return {
      message: 'Token de notificación push desvinculado exitosamente.',
      pushHabilitado: false,
    };
  }
}
