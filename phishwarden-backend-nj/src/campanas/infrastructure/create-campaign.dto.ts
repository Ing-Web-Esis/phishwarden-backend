import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsArray,
  IsUUID,
  IsDate,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShippingMethod } from '../domain/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({
    example: 'Campaña de concientización Q4 - Tacna',
    description: 'Nombre identificador de la campaña',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 1,
    description: 'ID de la plantilla de phishing (entero)',
  })
  @IsInt()
  templateId: number;

  @ApiProperty({
    example: '2026-11-01T09:00:00.000Z',
    description: 'Fecha y hora programada para el inicio del envío (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  scheduledDate: Date;

  @ApiProperty({
    enum: ShippingMethod,
    example: ShippingMethod.MASIVO,
    description: 'Modalidad de envío de los correos/SMS',
  })
  @IsEnum(ShippingMethod)
  shippingMethod: ShippingMethod;

  @ApiPropertyOptional({
    type: [String],
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    description: 'Lista de UUIDs de colaboradores objetivo pertenecientes a la empresa',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetUserIds?: string[];

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 2],
    description: 'Lista de IDs de departamentos para asignar a todos sus miembros',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  departmentIds?: number[];
}
