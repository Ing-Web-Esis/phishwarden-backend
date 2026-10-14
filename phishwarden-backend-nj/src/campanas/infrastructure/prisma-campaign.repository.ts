import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CampaignRepositoryPort,
  CreateCampaignInput,
  UpdateCampaignInput,
  PaginatedCampaignsResult,
} from '../application/campaign.repository.port';
import {
  CampaignEntity,
  CampaignStatus,
  ShippingMethod,
} from '../domain/campaign.entity';

@Injectable()
export class PrismaCampaignRepository implements CampaignRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private get campaignModel(): any {
    return (this.prisma as any).campanas;
  }

  private get userModel(): any {
    return (this.prisma as any).usuarios;
  }

  private mapToEntity(item: any): CampaignEntity {
    const targetUserIds = item.campana_usuarios
      ? item.campana_usuarios.map((cu: any) => cu.usuario_id)
      : [];

    return new CampaignEntity(
      item.id,
      item.plantilla_id,
      item.nombre,
      item.fecha_programada,
      item.modalidad_envio as ShippingMethod,
      item.estado as CampaignStatus,
      item.creado_el || undefined,
      targetUserIds,
    );
  }

  async findById(id: string, companyId?: number): Promise<CampaignEntity | null> {
    if (!this.campaignModel) return null;

    const where: any = { id };

    if (companyId) {
      where.campana_usuarios = {
        some: {
          usuarios: {
            empresa_id: companyId,
          },
        },
      };
    }

    const campaign = await this.campaignModel.findUnique({
      where,
      include: {
        campana_usuarios: {
          select: { usuario_id: true },
        },
      },
    });

    return campaign ? this.mapToEntity(campaign) : null;
  }

  async findPaginated(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    status?: CampaignStatus,
  ): Promise<PaginatedCampaignsResult> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (!this.campaignModel) {
      return { data: [], total: 0, page: pageNum, limit: limitNum };
    }

    const where: any = {
      campana_usuarios: {
        some: {
          usuarios: {
            empresa_id: companyId,
          },
        },
      },
    };

    if (status) {
      where.estado = status;
    }

    if (search) {
      where.nombre = { contains: search, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.campaignModel.count({ where }),
      this.campaignModel.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { creado_el: 'desc' },
        include: {
          campana_usuarios: {
            select: { usuario_id: true },
          },
        },
      }),
    ]);

    const data = items.map((item: any) => this.mapToEntity(item));

    return { data, total, page: pageNum, limit: limitNum };
  }

  async validateUsersBelongToCompany(
    userIds: string[],
    companyId: number,
  ): Promise<boolean> {
    if (!this.userModel || userIds.length === 0) return false;

    const count = await this.userModel.count({
      where: {
        id: { in: userIds },
        empresa_id: companyId,
      },
    });

    return count === userIds.length;
  }

  async create(
    companyId: number,
    data: CreateCampaignInput,
  ): Promise<CampaignEntity> {
    if (!this.campaignModel) {
      throw new Error('El modelo de campañas no está disponible en Prisma.');
    }

    const created = await this.campaignModel.create({
      data: {
        plantilla_id: data.templateId,
        nombre: data.name,
        fecha_programada: new Date(data.scheduledDate),
        modalidad_envio: data.shippingMethod,
        estado: CampaignStatus.PROGRAMADA,
        campana_usuarios: {
          create: data.targetUserIds.map((userId) => ({
            usuario_id: userId,
          })),
        },
      },
      include: {
        campana_usuarios: {
          select: { usuario_id: true },
        },
      },
    });

    return this.mapToEntity(created);
  }

  async update(id: string, data: UpdateCampaignInput): Promise<CampaignEntity> {
    if (!this.campaignModel) {
      throw new Error('El modelo de campañas no está disponible en Prisma.');
    }

    const updateData: any = {};
    if (data.name) updateData.nombre = data.name;
    if (data.templateId) updateData.plantilla_id = data.templateId;
    if (data.scheduledDate) updateData.fecha_programada = new Date(data.scheduledDate);
    if (data.shippingMethod) updateData.modalidad_envio = data.shippingMethod;
    if (data.status) updateData.estado = data.status;

    const updated = await this.campaignModel.update({
      where: { id },
      data: updateData,
      include: {
        campana_usuarios: {
          select: { usuario_id: true },
        },
      },
    });

    return this.mapToEntity(updated);
  }

  async cancel(id: string): Promise<boolean> {
    if (!this.campaignModel) return false;

    await this.campaignModel.update({
      where: { id },
      data: { estado: CampaignStatus.CANCELADA },
    });

    return true;
  }
}