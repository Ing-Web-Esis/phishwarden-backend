import { IsOptional, IsInt, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../domain/campaign.entity';

export class GetCampaignsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1, description: 'Número de página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Cantidad de elementos por página' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'Q4', description: 'Filtro por nombre de campaña' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, description: 'Filtro por estado de la campaña' })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ example: 'phishing', description: 'Filtro por método de ataque de la plantilla (phishing | smishing)' })
  @IsOptional()
  @IsString()
  attackType?: string;
}
