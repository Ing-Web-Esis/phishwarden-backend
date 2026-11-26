import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum PortalTipoBaseDto {
  UNJBG = 'unjbg',
  MICROSOFT = 'microsoft',
  GOOGLE = 'google',
  BANCARIO = 'bancario',
  CORPORATIVO = 'corporativo',
  PERSONALIZADO = 'personalizado',
}

export class CreatePortalDto {
  @ApiProperty({
    description: 'Nombre identificador interno del portal simulado',
    example: 'Portal de Intranet Corporativa',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({
    description: 'Arquetipo base de diseño para la landing page',
    enum: PortalTipoBaseDto,
    default: PortalTipoBaseDto.PERSONALIZADO,
  })
  @IsOptional()
  @IsEnum(PortalTipoBaseDto)
  tipoBase?: PortalTipoBaseDto;

  @ApiProperty({
    description: 'Título principal mostrado en la cabecera o tarjeta del portal falso',
    example: 'Iniciar sesión en Intranet',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  tituloPortal!: string;

  @ApiPropertyOptional({
    description: 'Subtítulo o descripción secundaria del portal',
    example: 'Ingrese sus credenciales de red institucional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitulo?: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen del logotipo corporativo para el portal falso',
    example: 'https://miempresa.com/assets/logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Color primario de botones e íconos en formato HEX',
    example: '#1d4ed8',
    default: '#0067b8',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  colorPrimario?: string;

  @ApiPropertyOptional({
    description: 'Color de fondo del contenedor o página en formato HEX',
    example: '#f8fafc',
    default: '#f3f4f6',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  colorFondo?: string;

  @ApiPropertyOptional({
    description: 'Texto del label para el campo de usuario/correo',
    example: 'Correo institucional o ID',
    default: 'Correo electrónico o usuario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  labelUsuario?: string;

  @ApiPropertyOptional({
    description: 'Texto del label para el campo de contraseña',
    example: 'Clave de acceso de red',
    default: 'Contraseña',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  labelPassword?: string;

  @ApiPropertyOptional({
    description: 'Texto del botón de acción principal',
    example: 'Acceder a mi cuenta',
    default: 'Iniciar sesión',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  textoBoton?: string;
}
