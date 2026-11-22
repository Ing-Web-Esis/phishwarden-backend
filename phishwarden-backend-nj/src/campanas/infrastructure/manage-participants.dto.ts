import {
  IsArray,
  IsUUID,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ManageParticipantsDto {
  @ApiPropertyOptional({
    type: [String],
    example: ['b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'],
    description: 'Lista de UUIDs de colaboradores a agregar a la campaña',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  targetUserIds?: string[];

  @ApiPropertyOptional({
    type: [Number],
    example: [3],
    description: 'Lista de IDs de departamentos para incorporar a todos sus miembros activos',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  departmentIds?: number[];
}
