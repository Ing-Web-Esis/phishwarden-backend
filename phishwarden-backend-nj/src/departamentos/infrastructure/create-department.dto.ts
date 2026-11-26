import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Recursos Humanos', description: 'Nombre del área o departamento' })
  @IsString()
  @IsNotEmpty()
  nombre: string;
}