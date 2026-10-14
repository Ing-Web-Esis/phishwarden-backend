import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsArray,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingMethod } from '../domain/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({
    example: 'Campaña de concientización Q4 - Tacna',
    description: 'Nombre de la campaña',
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
    description: 'Fecha y hora programada para el inicio del envío',
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

  @ApiProperty({
    type: [String],
    example: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    description: 'Lista de UUIDs de usuarios objetivo pertenecientes a la empresa',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  targetUserIds: string[];
}