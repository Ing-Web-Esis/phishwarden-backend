import { Injectable, Inject } from '@nestjs/common';
import { MOBILE_REPOSITORY_PORT } from './mobile.repository.port';
import type { MobileRepositoryPort } from './mobile.repository.port';
import type { MobileRankingItemEntity } from '../domain/mobile-ranking.entity';

export interface MobileRankingResult {
  miPosicion: number;
  ranking: MobileRankingItemEntity[];
}

@Injectable()
export class GetMobileRankingUseCase {
  constructor(
    @Inject(MOBILE_REPOSITORY_PORT)
    private readonly mobileRepository: MobileRepositoryPort,
  ) {}

  async execute(companyId: number, currentUserId: string): Promise<MobileRankingResult> {
    return await this.mobileRepository.getCompanyRanking(companyId, currentUserId);
  }
}
