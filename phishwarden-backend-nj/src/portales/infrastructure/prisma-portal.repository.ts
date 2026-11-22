import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  PortalRepositoryPort,
  CreatePortalData,
  UpdatePortalData,
} from '../application/portal.repository.port';
import { PortalEntity, type PortalTipoBase } from '../domain/portal.entity';

@Injectable()
export class PrismaPortalRepository implements PortalRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(row: any): PortalEntity {
    return new PortalEntity(
      row.id,
      row.empresa_id,
      row.nombre,
      row.tipo_base as PortalTipoBase,
      row.titulo_portal,
      row.subtitulo,
      row.logo_url,
      row.color_primario,
      row.color_fondo,
      row.label_usuario,
      row.label_password,
      row.texto_boton,
      row.fecha_creacion,
    );
  }

  async findByCompany(companyId: number): Promise<PortalEntity[]> {
    const rows = await this.prisma.portales_simulados.findMany({
      where: {
        OR: [{ empresa_id: null }, { empresa_id: companyId }],
      },
      orderBy: [{ empresa_id: 'desc' }, { id: 'asc' }],
    });

    return rows.map((r) => this.mapToEntity(r));
  }

  async findById(id: number): Promise<PortalEntity | null> {
    const row = await this.prisma.portales_simulados.findUnique({
      where: { id },
    });

    return row ? this.mapToEntity(row) : null;
  }

  async findGlobalByTipoBase(tipoBase: string): Promise<PortalEntity | null> {
    const row = await this.prisma.portales_simulados.findFirst({
      where: {
        tipo_base: tipoBase,
        empresa_id: null,
      },
    });

    return row ? this.mapToEntity(row) : null;
  }

  async create(data: CreatePortalData): Promise<PortalEntity> {
    const row = await this.prisma.portales_simulados.create({
      data: {
        empresa_id: data.empresaId,
        nombre: data.nombre,
        tipo_base: data.tipoBase || 'personalizado',
        titulo_portal: data.tituloPortal,
        subtitulo: data.subtitulo,
        logo_url: data.logoUrl,
        color_primario: data.colorPrimario || '#0067b8',
        color_fondo: data.colorFondo || '#f3f4f6',
        label_usuario: data.labelUsuario || 'Correo electrónico o usuario',
        label_password: data.labelPassword || 'Contraseña',
        texto_boton: data.textoBoton || 'Iniciar sesión',
      },
    });

    return this.mapToEntity(row);
  }

  async update(id: number, data: UpdatePortalData): Promise<PortalEntity> {
    const row = await this.prisma.portales_simulados.update({
      where: { id },
      data: {
        ...(data.nombre !== undefined && { nombre: data.nombre }),
        ...(data.tituloPortal !== undefined && { titulo_portal: data.tituloPortal }),
        ...(data.subtitulo !== undefined && { subtitulo: data.subtitulo }),
        ...(data.logoUrl !== undefined && { logo_url: data.logoUrl }),
        ...(data.colorPrimario !== undefined && { color_primario: data.colorPrimario }),
        ...(data.colorFondo !== undefined && { color_fondo: data.colorFondo }),
        ...(data.labelUsuario !== undefined && { label_usuario: data.labelUsuario }),
        ...(data.labelPassword !== undefined && { label_password: data.labelPassword }),
        ...(data.textoBoton !== undefined && { texto_boton: data.textoBoton }),
      },
    });

    return this.mapToEntity(row);
  }

  async delete(id: number): Promise<void> {
    await this.prisma.portales_simulados.delete({
      where: { id },
    });
  }
}
