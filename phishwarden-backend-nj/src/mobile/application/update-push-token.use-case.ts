import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';

export interface UpdatePushTokenResult {
  message: string;
  pushHabilitado: boolean;
}

@Injectable()
export class UpdatePushTokenUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(usuarioId: string, token: string): Promise<UpdatePushTokenResult> {
    const updated = await this.mobileRepository.updatePushToken(usuarioId, token.trim());
    if (!updated) {
      throw new NotFoundException('Colaborador no encontrado para registrar el token de notificación.');
    }

    return {
      message: 'Token de notificación push registrado exitosamente.',
      pushHabilitado: true,
    };
  }
}
