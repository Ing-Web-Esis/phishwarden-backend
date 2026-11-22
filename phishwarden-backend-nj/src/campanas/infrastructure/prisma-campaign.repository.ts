import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CampaignRepositoryPort,
  CreateCampaignInput,
  UpdateCampaignInput,
  FindCampaignsParams,
  FindParticipantsParams,
  PaginatedCampaignsResult,
} from '../application/campaign.repository.port';
import type { CampaignSummaryResult } from '../application/campaign-summary.result';
import type { CampaignDetailResult } from '../application/campaign-detail.result';
import type {
  CampaignParticipantItem,
  PaginatedParticipantsResult,
} from '../application/campaign-participant.result';
import {
  CampaignEntity,
  CampaignStatus,
  ShippingMethod,
} from '../domain/campaign.entity';

@Injectable()
export class PrismaCampaignRepository implements CampaignRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private get campaignModel() {
    return this.prisma.campanas;
  }

  private get userModel() {
    return this.prisma.usuarios;
  }

  private get templateModel() {
    return this.prisma.plantillas;
  }

  private get campaignUserModel() {
    return this.prisma.campana_usuarios;
  }

  async findSummary(companyId: number): Promise<CampaignSummaryResult> {
    const baseWhere = {
      campana_usuarios: {
        some: {
          usuarios: {
            empresa_id: companyId,
          },
        },
      },
    };

    const [total, programadas, enCurso, finalizadas, canceladas] =
      await Promise.all([
        this.campaignModel.count({ where: baseWhere }),
        this.campaignModel.count({
          where: { ...baseWhere, estado: CampaignStatus.PROGRAMADA },
        }),
        this.campaignModel.count({
          where: { ...baseWhere, estado: CampaignStatus.EN_CURSO },
        }),
        this.campaignModel.count({
          where: { ...baseWhere, estado: CampaignStatus.FINALIZADA },
        }),
        this.campaignModel.count({
          where: { ...baseWhere, estado: CampaignStatus.CANCELADA },
        }),
      ]);

    return { total, programadas, enCurso, finalizadas, canceladas };
  }

  async findPaginated(
    companyId: number,
    params: FindCampaignsParams,
  ): Promise<PaginatedCampaignsResult> {
    const pageNum = Number(params.page) > 0 ? Number(params.page) : 1;
    const limitNum = Number(params.limit) > 0 ? Number(params.limit) : 10;

    const where: any = {
      campana_usuarios: {
        some: {
          usuarios: {
            empresa_id: companyId,
          },
        },
      },
    };

    if (params.status) {
      where.estado = params.status;
    }

    if (params.search) {
      where.nombre = { contains: params.search, mode: 'insensitive' };
    }

    if (params.attackType) {
      where.plantillas = {
        metodo_ataque: {
          equals: params.attackType.toLowerCase(),
          mode: 'insensitive',
        },
      };
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
          plantillas: {
            select: {
              id: true,
              titulo: true,
              metodo_ataque: true,
            },
          },
          _count: {
            select: { campana_usuarios: true },
          },
        },
      }),
    ]);

    const data = items.map((item) => {
      const targetUserIds = item.campana_usuarios
        ? item.campana_usuarios
            .map((cu) => cu.usuario_id)
            .filter((uid): uid is string => uid !== null)
        : [];

      return new CampaignEntity(
        item.id,
        item.plantilla_id ?? 0,
        item.nombre,
        item.fecha_programada,
        item.modalidad_envio as ShippingMethod,
        item.estado as CampaignStatus,
        item.creado_el || undefined,
        targetUserIds,
        item.plantillas
          ? {
              id: item.plantillas.id,
              titulo: item.plantillas.titulo,
              metodoAtaque: item.plantillas.metodo_ataque,
            }
          : undefined,
        item._count?.campana_usuarios ?? 0,
      );
    });

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findById(
    id: string,
    companyId?: number,
  ): Promise<CampaignDetailResult | null> {
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

    const campaign = await this.campaignModel.findFirst({
      where,
      include: {
        plantillas: true,
        _count: {
          select: { campana_usuarios: true },
        },
      },
    });

    if (!campaign) return null;

    return {
      id: campaign.id,
      templateId: campaign.plantilla_id,
      name: campaign.nombre,
      scheduledDate: campaign.fecha_programada,
      shippingMethod: campaign.modalidad_envio ?? 'masivo',
      status: campaign.estado ?? 'programada',
      createdAt: campaign.creado_el,
      template: campaign.plantillas
        ? {
            id: campaign.plantillas.id,
            titulo: campaign.plantillas.titulo,
            metodoAtaque: campaign.plantillas.metodo_ataque,
            asunto: campaign.plantillas.asunto,
            cuerpoHtml: campaign.plantillas.cuerpo_html,
            indicadorDificultad: campaign.plantillas.indicador_dificultad,
          }
        : null,
      totalParticipants: campaign._count?.campana_usuarios ?? 0,
    };
  }

  async findParticipantsPaginated(
    campaignId: string,
    companyId: number,
    params: FindParticipantsParams,
  ): Promise<PaginatedParticipantsResult> {
    const pageNum = Number(params.page) > 0 ? Number(params.page) : 1;
    const limitNum = Number(params.limit) > 0 ? Number(params.limit) : 10;

    const where: any = {
      campana_id: campaignId,
      usuarios: {
        empresa_id: companyId,
      },
    };

    if (params.search) {
      where.usuarios.OR = [
        { nombre: { contains: params.search, mode: 'insensitive' } },
        { correo_corporativo: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.departmentId) {
      where.usuarios.departamento_id = Number(params.departmentId);
    }

    const [total, items] = await Promise.all([
      this.campaignUserModel.count({ where }),
      this.campaignUserModel.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { id: 'asc' },
        include: {
          usuarios: {
            select: {
              id: true,
              nombre: true,
              correo_corporativo: true,
              estado: true,
              departamentos: {
                select: { nombre: true },
              },
            },
          },
        },
      }),
    ]);

    const data: CampaignParticipantItem[] = items.map((item) => ({
      usuarioId: item.usuarios?.id ?? item.usuario_id ?? '',
      nombre: item.usuarios?.nombre ?? '',
      correo: item.usuarios?.correo_corporativo ?? '',
      departamento: item.usuarios?.departamentos?.nombre ?? null,
      estado: item.usuarios?.estado ?? 'activo',
    }));

    return { data, total, page: pageNum, limit: limitNum };
  }

  async validateTemplateBelongsToCompanyOrGlobal(
    templateId: number,
    companyId: number,
  ): Promise<boolean> {
    const template = await this.templateModel.findFirst({
      where: {
        id: templateId,
        OR: [{ empresa_id: companyId }, { empresa_id: null }],
      },
    });

    return !!template;
  }

  async validateUsersBelongToCompany(
    userIds: string[],
    companyId: number,
  ): Promise<boolean> {
    if (userIds.length === 0) return false;

    const count = await this.userModel.count({
      where: {
        id: { in: userIds },
        empresa_id: companyId,
      },
    });

    return count === userIds.length;
  }

  async findUserIdsByDepartmentIds(
    departmentIds: number[],
    companyId: number,
  ): Promise<string[]> {
    if (departmentIds.length === 0) return [];

    const users = await this.userModel.findMany({
      where: {
        departamento_id: { in: departmentIds },
        empresa_id: companyId,
        estado: 'activo',
      },
      select: { id: true },
    });

    return users.map((u) => u.id);
  }

  async isUserEnrolledInCampaign(
    campaignId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.campaignUserModel.count({
      where: {
        campana_id: campaignId,
        usuario_id: userId,
      },
    });

    return count > 0;
  }

  async countParticipants(
    campaignId: string,
    companyId: number,
  ): Promise<number> {
    return this.campaignUserModel.count({
      where: {
        campana_id: campaignId,
        usuarios: {
          empresa_id: companyId,
        },
      },
    });
  }

  async create(
    companyId: number,
    data: CreateCampaignInput,
  ): Promise<CampaignEntity> {
    const created = await this.prisma.$transaction(async (tx) => {
      const camp = await tx.campanas.create({
        data: {
          plantilla_id: data.templateId,
          nombre: data.name,
          fecha_programada: new Date(data.scheduledDate),
          modalidad_envio: data.shippingMethod,
          estado: CampaignStatus.PROGRAMADA,
        },
      });

      if (data.targetUserIds.length > 0) {
        await tx.campana_usuarios.createMany({
          data: data.targetUserIds.map((userId) => ({
            campana_id: camp.id,
            usuario_id: userId,
            token_rastreo: randomUUID(),
          })),
        });
      }

      return camp;
    });

    return new CampaignEntity(
      created.id,
      created.plantilla_id ?? 0,
      created.nombre,
      created.fecha_programada,
      created.modalidad_envio as ShippingMethod,
      created.estado as CampaignStatus,
      created.creado_el || undefined,
      data.targetUserIds,
    );
  }

  async update(
    id: string,
    companyId: number,
    data: UpdateCampaignInput,
  ): Promise<CampaignEntity> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.nombre = data.name;
    if (data.templateId !== undefined) updateData.plantilla_id = data.templateId;
    if (data.scheduledDate !== undefined)
      updateData.fecha_programada = new Date(data.scheduledDate);
    if (data.shippingMethod !== undefined)
      updateData.modalidad_envio = data.shippingMethod;
    if (data.status !== undefined) updateData.estado = data.status;

    const updated = await this.campaignModel.update({
      where: { id },
      data: updateData,
    });

    return new CampaignEntity(
      updated.id,
      updated.plantilla_id ?? 0,
      updated.nombre,
      updated.fecha_programada,
      updated.modalidad_envio as ShippingMethod,
      updated.estado as CampaignStatus,
      updated.creado_el || undefined,
    );
  }

  async addParticipants(
    campaignId: string,
    companyId: number,
    userIds: string[],
  ): Promise<number> {
    const existing = await this.campaignUserModel.findMany({
      where: {
        campana_id: campaignId,
        usuario_id: { in: userIds },
      },
      select: { usuario_id: true },
    });

    const existingSet = new Set(existing.map((e) => e.usuario_id));
    const toAdd = userIds.filter((uid) => !existingSet.has(uid));

    if (toAdd.length === 0) return 0;

    const result = await this.campaignUserModel.createMany({
      data: toAdd.map((userId) => ({
        campana_id: campaignId,
        usuario_id: userId,
        token_rastreo: randomUUID(),
      })),
    });

    return result.count;
  }

  async removeParticipant(
    campaignId: string,
    companyId: number,
    userId: string,
  ): Promise<boolean> {
    await this.campaignUserModel.deleteMany({
      where: {
        campana_id: campaignId,
        usuario_id: userId,
        usuarios: {
          empresa_id: companyId,
        },
      },
    });

    return true;
  }

  async duplicate(
    id: string,
    companyId: number,
    newName?: string,
    scheduledDate?: Date,
  ): Promise<CampaignEntity> {
    const source = await this.campaignModel.findFirst({
      where: {
        id,
        campana_usuarios: {
          some: {
            usuarios: {
              empresa_id: companyId,
            },
          },
        },
      },
      include: {
        campana_usuarios: {
          where: {
            usuarios: {
              empresa_id: companyId,
            },
          },
          select: { usuario_id: true },
        },
      },
    });

    if (!source) {
      throw new Error('Campaña origen no encontrada.');
    }

    const campaignName = newName?.trim() || `Copia de ${source.nombre}`;
    const targetDate = scheduledDate
      ? new Date(scheduledDate)
      : source.fecha_programada;
    const userIds = source.campana_usuarios
      .map((cu) => cu.usuario_id)
      .filter((uid): uid is string => uid !== null);

    const duplicated = await this.prisma.$transaction(async (tx) => {
      const camp = await tx.campanas.create({
        data: {
          plantilla_id: source.plantilla_id,
          nombre: campaignName,
          fecha_programada: targetDate,
          modalidad_envio: source.modalidad_envio,
          estado: CampaignStatus.PROGRAMADA,
        },
      });

      if (userIds.length > 0) {
        await tx.campana_usuarios.createMany({
          data: userIds.map((userId) => ({
            campana_id: camp.id,
            usuario_id: userId,
            token_rastreo: randomUUID(),
          })),
        });
      }

      return camp;
    });

    return new CampaignEntity(
      duplicated.id,
      duplicated.plantilla_id ?? 0,
      duplicated.nombre,
      duplicated.fecha_programada,
      duplicated.modalidad_envio as ShippingMethod,
      duplicated.estado as CampaignStatus,
      duplicated.creado_el || undefined,
      userIds,
    );
  }

  async cancel(id: string, companyId: number): Promise<boolean> {
    await this.campaignModel.updateMany({
      where: {
        id,
        campana_usuarios: {
          some: {
            usuarios: {
              empresa_id: companyId,
            },
          },
        },
      },
      data: { estado: CampaignStatus.CANCELADA },
    });

    return true;
  }

  async finalize(id: string, companyId: number): Promise<boolean> {
    await this.campaignModel.updateMany({
      where: {
        id,
        campana_usuarios: {
          some: {
            usuarios: {
              empresa_id: companyId,
            },
          },
        },
      },
      data: { estado: CampaignStatus.FINALIZADA },
    });

    return true;
  }
}
