import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  TemplateRepositoryPort,
  CreateTemplateInput,
  UpdateTemplateInput,
  PaginatedTemplatesResult,
} from '../application/template.repository.port';
import {
  TemplateEntity,
  AttackType,
  DifficultyLevel,
  LandingType,
} from '../domain/template.entity';

@Injectable()
export class PrismaTemplateRepository implements TemplateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private get model(): any {
    return (this.prisma as any).plantillas || (this.prisma as any).plantillas_phishing;
  }

  // Mapeo hacia los valores permitidos por el CHECK constraint de la BD
  private mapAttackTypeToDb(attackType?: AttackType): string {
    if (attackType === AttackType.SMISHING) {
      return 'smishing';
    }
    return 'phishing';
  }

  private mapDifficultyToDb(difficulty?: DifficultyLevel): string {
    if (!difficulty) return 'media';
    const norm = difficulty.toUpperCase();
    if (norm === 'BAJO') return 'baja';
    if (norm === 'ALTO') return 'alta';
    return 'media';
  }

  // Mapeo desde la BD hacia el Dominio
  private mapDifficultyFromDb(rawDiff?: string): DifficultyLevel {
    if (!rawDiff) return DifficultyLevel.MEDIO;
    const norm = rawDiff.toLowerCase();
    if (norm === 'baja') return DifficultyLevel.BAJO;
    if (norm === 'alta') return DifficultyLevel.ALTO;
    return DifficultyLevel.MEDIO;
  }

  private mapAttackTypeFromDb(rawType?: string): AttackType {
    if (!rawType) return AttackType.PHISHING;
    const norm = rawType.toLowerCase();
    if (norm === 'smishing') return AttackType.SMISHING;
    return AttackType.PHISHING;
  }

  private mapLandingTipoFromDb(rawLanding?: string): LandingType {
    if (!rawLanding) return LandingType.GENERICO;
    const norm = rawLanding.toLowerCase();
    switch (norm) {
      case 'microsoft':
        return LandingType.MICROSOFT;
      case 'google':
        return LandingType.GOOGLE;
      case 'corporativo':
        return LandingType.CORPORATIVO;
      case 'bancario':
        return LandingType.BANCARIO;
      case 'unjbg':
        return LandingType.UNJBG;
      case 'personalizado':
        return LandingType.PERSONALIZADO;
      default:
        return LandingType.GENERICO;
    }
  }

  private mapToEntity(item: any): TemplateEntity {
    return new TemplateEntity(
      Number(item.id),
      item.empresa_id ?? null,
      item.titulo || '',
      item.asunto || '',
      item.cuerpo_html || '',
      this.mapAttackTypeFromDb(item.metodo_ataque),
      this.mapDifficultyFromDb(item.indicador_dificultad),
      item.empresa_id == null,
      item.fecha_creacion || undefined,
      undefined,
      this.mapLandingTipoFromDb(item.landing_tipo),
      item.landing_id ?? null,
    );
  }

  async findById(id: number): Promise<TemplateEntity | null> {
    if (!this.model) return null;

    const numericId = Number(id);
    const template = await this.model.findUnique({
      where: { id: numericId },
    });

    return template ? this.mapToEntity(template) : null;
  }

  async findPaginated(
    companyId: number,
    page: number,
    limit: number,
    search?: string,
    attackType?: AttackType,
    difficulty?: DifficultyLevel,
  ): Promise<PaginatedTemplatesResult> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;

    if (!this.model) {
      return { data: [], total: 0, page: pageNum, limit: limitNum };
    }

    const where: any = {
      OR: [{ empresa_id: null }, { empresa_id: companyId }],
    };

    if (attackType) {
      where.metodo_ataque = this.mapAttackTypeToDb(attackType);
    }

    if (difficulty) {
      where.indicador_dificultad = this.mapDifficultyToDb(difficulty);
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { titulo: { contains: search, mode: 'insensitive' } },
            { asunto: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [total, items] = await Promise.all([
      this.model.count({ where }),
      this.model.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { id: 'desc' },
      }),
    ]);

    const data = items.map((item: any) => this.mapToEntity(item));

    return { data, total, page: pageNum, limit: limitNum };
  }

  async create(
    companyId: number | null,
    data: CreateTemplateInput,
  ): Promise<TemplateEntity> {
    if (!this.model) {
      throw new Error('El modelo de plantillas no está disponible en Prisma.');
    }

    const created = await this.model.create({
      data: {
        empresa_id: companyId,
        titulo: data.title,
        asunto: data.subject,
        cuerpo_html: data.bodyHtml,
        metodo_ataque: this.mapAttackTypeToDb(data.attackType),
        indicador_dificultad: this.mapDifficultyToDb(data.difficulty),
        landing_tipo: data.landingTipo || 'generico',
        landing_id: data.landingId ?? null,
      },
    });

    return this.mapToEntity(created);
  }

  async update(
    companyId: number,
    id: number,
    data: UpdateTemplateInput,
  ): Promise<TemplateEntity> {
    if (!this.model) {
      throw new Error('El modelo de plantillas no está disponible en Prisma.');
    }

    const numericId = Number(id);
    const updateData: any = {};
    if (data.title) updateData.titulo = data.title;
    if (data.subject) updateData.asunto = data.subject;
    if (data.bodyHtml) updateData.cuerpo_html = data.bodyHtml;
    if (data.attackType) {
      updateData.metodo_ataque = this.mapAttackTypeToDb(data.attackType);
    }
    if (data.difficulty) {
      updateData.indicador_dificultad = this.mapDifficultyToDb(data.difficulty);
    }
    if (data.landingTipo) {
      updateData.landing_tipo = data.landingTipo;
    }
    if (data.landingId !== undefined) {
      updateData.landing_id = data.landingId;
    }

    const updated = await this.model.update({
      where: { id: numericId },
      data: updateData,
    });

    return this.mapToEntity(updated);
  }

  async delete(companyId: number, id: number): Promise<boolean> {
    if (!this.model) return false;

    const numericId = Number(id);
    const result = await this.model.deleteMany({
      where: { id: numericId, empresa_id: companyId },
    });

    return result.count > 0;
  }
}