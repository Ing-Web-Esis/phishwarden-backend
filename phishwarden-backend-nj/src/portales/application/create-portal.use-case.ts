import { Injectable, Inject } from '@nestjs/common';
import { PORTAL_REPOSITORY_PORT } from './portal.repository.port';
import type { PortalRepositoryPort, CreatePortalData } from './portal.repository.port';
import type { PortalEntity } from '../domain/portal.entity';

export interface CreatePortalInput {
  nombre: string;
  tipoBase?: string;
  tituloPortal: string;
  subtitulo?: string | null;
  logoUrl?: string | null;
  colorPrimario?: string;
  colorFondo?: string;
  labelUsuario?: string;
  labelPassword?: string;
  textoBoton?: string;
}

@Injectable()
export class CreatePortalUseCase {
  constructor(
    @Inject(PORTAL_REPOSITORY_PORT)
    private readonly portalRepository: PortalRepositoryPort,
  ) {}

  async execute(companyId: number, input: CreatePortalInput): Promise<PortalEntity> {
    const data: CreatePortalData = {
      empresaId: companyId,
      nombre: input.nombre.trim(),
      tipoBase: (input.tipoBase as any) || 'personalizado',
      tituloPortal: input.tituloPortal.trim(),
      subtitulo: input.subtitulo?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
      colorPrimario: input.colorPrimario || '#0067b8',
      colorFondo: input.colorFondo || '#f3f4f6',
      labelUsuario: input.labelUsuario || 'Correo electrónico o usuario',
      labelPassword: input.labelPassword || 'Contraseña',
      textoBoton: input.textoBoton || 'Iniciar sesión',
    };

    return this.portalRepository.create(data);
  }
}
