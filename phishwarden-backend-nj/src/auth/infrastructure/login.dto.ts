import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@phishwarden.com',
    description: 'Correo corporativo del usuario o administrador',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    example: 'Admin123*',
    description: 'Contraseña (solo requerida para el Administrador en la plataforma web)',
  })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    example: 'SALA2026',
    description: 'Código de sala o empresa (solo requerido para el Usuario Final en la app móvil)',
  })
  @IsString()
  @IsOptional()
  codigoEmpresa?: string;
}