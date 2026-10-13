import { IsString, IsEmail, IsOptional, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Mariano Silva R.', description: 'Nombre completo' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'mariano.silva@techcorp.com', description: 'Correo corporativo' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 2, description: 'ID del departamento' })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ example: '+51999888777', description: 'Número de teléfono' })
  @IsOptional()
  @IsString()
  phone?: string;
}