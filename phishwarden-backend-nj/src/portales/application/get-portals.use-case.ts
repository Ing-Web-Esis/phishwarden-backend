import { Injectable, Inject } from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT } from './portal.repository.port';
import type { PortalRepositoryPort } from './portal.repository.port';
import type { PortalEntity } from '../domain/portal.entity';

@Injectable()
export class GetPortalsUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT)
    private readonly portalRepository: PortalRepositoryPort,
  ) {}

  async execute(companyId: number): Promise<PortalEntity[]> {
    return this.portalRepository.findByCompany(companyId);
  }
}
