import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMethod } from '../domain/campaign.entity';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    example: 'Campaña de concientización Q4 - Modificada',
    description: 'Nuevo nombre de la campaña',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Nuevo ID de la plantilla de phishing (entero)',
  })
  @IsOptional()
  @IsInt()
  templateId?: number;

  @ApiPropertyOptional({
    example: '2026-11-05T10:00:00.000Z',
    description: 'Nueva fecha y hora programada para el inicio del envío (ISO 8601)',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;

  @ApiPropertyOptional({
    enum: ShippingMethod,
    example: ShippingMethod.ESCALONADO,
    description: 'Nueva modalidad de envío de los correos/SMS',
  })
  @IsOptional()
  @IsEnum(ShippingMethod)
  shippingMethod?: ShippingMethod;
}
