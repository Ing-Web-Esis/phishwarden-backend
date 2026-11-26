import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAdminProfileDto {
  @ApiPropertyOptional({ example: 'María García' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @ApiPropertyOptional({ example: 'maria.garcia@interbank.pe' })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ example: 'Interbank' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombreEmpresa?: string;

  @ApiPropertyOptional({
    example: 'Admin123*',
    description: 'Obligatoria únicamente cuando se cambia la contraseña.',
  })
  @IsOptional()
  @IsString()
  contraseñaActual?: string;

  @ApiPropertyOptional({ example: 'NuevaAdmin123*' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  nuevaContraseña?: string;
}
