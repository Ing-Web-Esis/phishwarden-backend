import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttackType, DifficultyLevel } from '../domain/template.entity';

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
}