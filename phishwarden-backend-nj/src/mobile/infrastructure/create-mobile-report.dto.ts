import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MobileReportChannel } from '../domain/mobile-report-channel.enum';

export class CreateMobileReportDto {
  @ApiProperty({
    enum: MobileReportChannel,
    example: MobileReportChannel.EMAIL,
    description: 'Canal por el cual se recibió el mensaje sospechoso (email, sms u otro)',
  })
  @IsEnum(MobileReportChannel, {
    message: 'El canal debe ser uno de los permitidos: email, sms, otro.',
  })
  canal!: MobileReportChannel;

  @ApiProperty({
    example: 'banco-alerta@seguridad-actualizacion.com',
    description: 'Remitente o número telefónico desde el que se recibió el intento de phishing/smishing',
  })
  @IsString({ message: 'El remitente debe ser un texto.' })
  @IsNotEmpty({ message: 'El remitente es obligatorio.' })
  @MaxLength(150, { message: 'El remitente no puede exceder los 150 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  remitente!: string;

  @ApiPropertyOptional({
    example: 'Urgente: Bloqueo de cuenta bancaria',
    description: 'Asunto o encabezado del mensaje sospechoso',
  })
  @IsOptional()
  @IsString({ message: 'El asunto debe ser un texto.' })
  @MaxLength(200, { message: 'El asunto no puede exceder los 200 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  asunto?: string;

  @ApiPropertyOptional({
    example: 'Recibí un correo solicitándome restablecer mis contraseñas corporativas de urgencia.',
    description: 'Detalle o descripción contextual del incidente reportado',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto.' })
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  descripcion?: string;

  @ApiPropertyOptional({
    example: 'https://banco-login-verificar.com',
    description: 'Enlace o URL sospechosa contenida en el mensaje',
  })
  @IsOptional()
  @IsString({ message: 'La URL sospechosa debe ser un texto.' })
  @MaxLength(500, { message: 'La URL sospechosa no puede exceder los 500 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  urlSospechosa?: string;
}
