import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT } from './portal.repository.port';
import type { PortalRepositoryPort } from './portal.repository.port';
import type { PortalEntity } from '../domain/portal.entity';

@Injectable()
export class GetPortalByIdUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT)
    private readonly portalRepository: PortalRepositoryPort,
  ) {}

  async execute(id: number, companyId: number): Promise<PortalEntity> {
    const portal = await this.portalRepository.findById(id);

    if (!portal) {
      throw new NotFoundException(`El portal simulado con ID ${id} no existe.`);
    }

    if (!portal.esGlobal && portal.empresaId !== companyId) {
      throw new NotFoundException(`El portal simulado con ID ${id} no fue encontrado.`);
    }

    return portal;
  }
}
