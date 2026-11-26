import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT } from './portal.repository.port';
import type { PortalRepositoryPort } from './portal.repository.port';

@Injectable()
export class DeletePortalUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT)
    private readonly portalRepository: PortalRepositoryPort,
  ) {}

  async execute(id: number, companyId: number): Promise<{ message: string }> {
    const portal = await this.portalRepository.findById(id);

    if (!portal) {
      throw new NotFoundException(`El portal simulado con ID ${id} no existe.`);
    }

    if (portal.esGlobal) {
      throw new ForbiddenException(
        'Los portales globales del sistema están protegidos y no pueden ser eliminados.',
      );
    }

    if (portal.empresaId !== companyId) {
      throw new ForbiddenException(
        'No tiene permisos para eliminar un portal de otra organización.',
      );
    }

    await this.portalRepository.delete(id);

    return {
      message: `El portal simulado "${portal.nombre}" fue eliminado exitosamente.`,
    };
  }
}
