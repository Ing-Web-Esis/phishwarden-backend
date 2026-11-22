import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePushTokenDto {
  @ApiProperty({
    example: 'dK8j9...fcm_registration_token_string',
    description: 'Registration Token emitido por Firebase Cloud Messaging (FCM) para el dispositivo móvil',
  })
  @IsString({ message: 'El token push debe ser un texto.' })
  @IsNotEmpty({ message: 'El token push es obligatorio.' })
  @MaxLength(512, { message: 'El token push no debe superar los 512 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  token!: string;
}
