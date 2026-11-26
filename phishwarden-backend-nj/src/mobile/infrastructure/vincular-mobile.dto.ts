import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class VincularMobileDto {
  @ApiProperty({
    example: 'mariano.silva@techcorp.com',
    description: 'Correo corporativo registrado del colaborador',
  })
  @IsEmail({}, { message: 'El correo corporativo debe tener un formato válido.' })
  @IsNotEmpty({ message: 'El correo corporativo es obligatorio.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  correoCorporativo!: string;

  @ApiProperty({
    example: 'PW9X2A81',
    description: 'Código de acceso de la empresa / sala proporcionado por el administrador',
  })
  @IsString({ message: 'El código de acceso debe ser un texto.' })
  @IsNotEmpty({ message: 'El código de acceso es obligatorio.' })
  @MaxLength(20, { message: 'El código de acceso no debe exceder 20 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  codigoAcceso!: string;
}
