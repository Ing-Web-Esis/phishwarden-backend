import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DuplicateCampaignDto {
  @ApiPropertyOptional({
    example: 'Campaña Clonada Q4',
    description: 'Nombre de la nueva campaña (por defecto: "Copia de <nombre original>")',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({
    example: '2026-12-01T09:00:00.000Z',
    description: 'Nueva fecha y hora programada para el inicio del envío (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;
}
