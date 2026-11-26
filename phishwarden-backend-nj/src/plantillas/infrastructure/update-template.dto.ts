import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttackType, DifficultyLevel, LandingType } from '../domain/template.entity';

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'Actualización Urgente M365 (Editado)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Acción Requerida: Verificación de seguridad' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({ example: '<p>Nuevo contenido HTML para {{nombre}}</p>' })
  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @ApiPropertyOptional({ enum: AttackType })
  @IsOptional()
  @IsEnum(AttackType)
  attackType?: AttackType;

  @ApiPropertyOptional({ enum: DifficultyLevel })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    enum: LandingType,
    example: LandingType.MICROSOFT,
    description: 'Tipo de landing page para la simulación (microsoft, google, corporativo, bancario, generico, unjbg, personalizado)',
  })
  @IsOptional()
  @IsEnum(LandingType)
  landingTipo?: LandingType;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID del portal simulado configurado (portales_simulados)',
  })
  @IsOptional()
  @IsInt()
  landingId?: number | null;
}