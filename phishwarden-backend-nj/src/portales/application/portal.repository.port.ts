import type { PortalEntity, PortalTipoBase } from '../domain/portal.entity';

export const PORTAL_REPOSITORY_PORT = 'PORTAL_REPOSITORY_PORT';

export interface CreatePortalData {
  empresaId: number | null;
  nombre: string;
  tipoBase?: PortalTipoBase;
  tituloPortal: string;
  subtitulo?: string | null;
  logoUrl?: string | null;
  colorPrimario?: string;
  colorFondo?: string;
  labelUsuario?: string;
  labelPassword?: string;
  textoBoton?: string;
}

export interface UpdatePortalData {
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

export interface PortalRepositoryPort {
  findByCompany(companyId: number): Promise<PortalEntity[]>;
  findById(id: number): Promise<PortalEntity | null>;
  findGlobalByTipoBase(tipoBase: string): Promise<PortalEntity | null>;
  create(data: CreatePortalData): Promise<PortalEntity>;
  update(id: number, data: UpdatePortalData): Promise<PortalEntity>;
  delete(id: number): Promise<void>;
}
