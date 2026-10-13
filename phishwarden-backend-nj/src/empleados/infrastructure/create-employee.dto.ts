import { IsString, IsNotEmpty, IsEmail, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Mariano Silva', description: 'Nombre completo del empleado' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'mariano.silva@techcorp.com', description: 'Correo corporativo' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 1, description: 'ID del departamento (opcional)' })
  @IsOptional()
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ example: 'Finanzas', description: 'Nombre del departamento para auto-crearlo si no se envía ID' })
  @IsOptional()
  @IsString()
  departmentName?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Número de teléfono (opcional para campañas SMS/Smishing)' })
  @IsOptional()
  @IsString()
  phone?: string;
}