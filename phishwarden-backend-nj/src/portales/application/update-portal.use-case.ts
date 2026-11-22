import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT } from './portal.repository.port';
import type { PortalRepositoryPort, UpdatePortalData } from './portal.repository.port';
import type { PortalEntity } from '../domain/portal.entity';

export interface UpdatePortalInput {
  nombre?: string;
  tituloPortal?: string;
  subtitulo?: string | null;
  logoUrl?: string | null;
  colorPrimario?: string;
  colorFondo?: string;
  labelUsuario?: string;
  labelPassword?: string;
  textoBoton?: string;
}

@Injectable()
export class UpdatePortalUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT)
    private readonly portalRepository: PortalRepositoryPort,
  ) {}

  async execute(
    id: number,
    companyId: number,
    input: UpdatePortalInput,
  ): Promise<PortalEntity> {
    const portal = await this.portalRepository.findById(id);

    if (!portal) {
      throw new NotFoundException(`El portal simulado con ID ${id} no existe.`);
    }

    if (portal.esGlobal) {
      throw new ForbiddenException(
        'Los portales globales del sistema están protegidos y no pueden ser modificados.',
      );
    }

    if (portal.empresaId !== companyId) {
      throw new ForbiddenException(
        'No tiene permisos para modificar un portal de otra organización.',
      );
    }

    const data: UpdatePortalData = {
      ...(input.nombre && { nombre: input.nombre.trim() }),
      ...(input.tituloPortal && { tituloPortal: input.tituloPortal.trim() }),
      ...(input.subtitulo !== undefined && { subtitulo: input.subtitulo?.trim() || null }),
      ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl?.trim() || null }),
      ...(input.colorPrimario && { colorPrimario: input.colorPrimario }),
      ...(input.colorFondo && { colorFondo: input.colorFondo }),
      ...(input.labelUsuario && { labelUsuario: input.labelUsuario }),
      ...(input.labelPassword && { labelPassword: input.labelPassword }),
      ...(input.textoBoton && { textoBoton: input.textoBoton }),
    };

    return this.portalRepository.update(id, data);
  }
}
