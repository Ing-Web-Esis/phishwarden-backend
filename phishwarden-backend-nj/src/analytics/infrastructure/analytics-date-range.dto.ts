import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class AnalyticsDateRangeDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio del rango (formato YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'El parámetro "desde" debe tener un formato de fecha válido (YYYY-MM-DD)' })
  desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin del rango (formato YYYY-MM-DD)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString({}, { message: 'El parámetro "hasta" debe tener un formato de fecha válido (YYYY-MM-DD)' })
  hasta?: string;
}
