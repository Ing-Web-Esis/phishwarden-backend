import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class TrackSubmitDto {
  @ApiProperty({
    description: 'Token único de rastreo UUIDv4 asignado al participante de la simulación.',
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  })
  @IsUUID('4', { message: 'El token de rastreo debe ser un UUID versión 4 válido.' })
  @IsNotEmpty({ message: 'El token de rastreo es obligatorio.' })
  token!: string;
}
