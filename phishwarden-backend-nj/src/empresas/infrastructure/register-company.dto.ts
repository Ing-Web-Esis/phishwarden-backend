import { IsString, IsNotEmpty, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCompanyDto {
  @ApiProperty({
    example: 'TechCorp Perú S.A.C.',
    description: 'Nombre oficial de la empresa u organización cliente',
  })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({
    example: 'Carlos Administrador',
    description: 'Nombre completo del administrador principal',
  })
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiProperty({
    example: 'carlos.admin@techcorp.com',
    description: 'Correo corporativo del administrador principal',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    example: 'AdminPass2026*',
    description: 'Contraseña de acceso al panel web (mínimo 8 caracteres)',
  })
  @IsString()
  @MinLength(8)
  password: string;
}