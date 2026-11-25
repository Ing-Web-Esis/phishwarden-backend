import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'TechCorp Perú S.A.C.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;
}
