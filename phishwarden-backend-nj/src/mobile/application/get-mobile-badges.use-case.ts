import { Injectable, Inject } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';
import type { MobileBadgeEntity } from '../domain/mobile-badge.entity';

export interface MobileBadgesCatalogResult {
  puntosTotales: number;
  medallas: MobileBadgeEntity[];
}

@Injectable()
export class GetMobileBadgesUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(userId: string): Promise<MobileBadgesCatalogResult> {
    return await this.mobileRepository.findUserBadgesWithCatalog(userId);
  }
}
