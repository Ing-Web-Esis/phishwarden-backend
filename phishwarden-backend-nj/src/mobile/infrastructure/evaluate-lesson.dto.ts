import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerItemDto {
  @ApiProperty({
    description: 'Identificador único de la pregunta evaluada',
    example: 1,
  })
  @IsInt({ message: 'El identificador de pregunta debe ser un número entero.' })
  preguntaId!: number;

  @ApiProperty({
    description: 'Alternativa seleccionada por el colaborador (A, B, C o D)',
    example: 'B',
    enum: ['A', 'B', 'C', 'D'],
  })
  @IsIn(['A', 'B', 'C', 'D'], {
    message: 'La respuesta seleccionada debe ser una de las alternativas: A, B, C o D.',
  })
  respuestaSeleccionada!: 'A' | 'B' | 'C' | 'D';
}

export class EvaluateLessonDto {
  @ApiProperty({
    description: 'Lista de respuestas para la evaluación de la microlección',
    type: [AnswerItemDto],
  })
  @IsArray({ message: 'Las respuestas deben proporcionarse como un arreglo.' })
  @ArrayMinSize(1, { message: 'Debe responder al menos una pregunta para evaluar la microlección.' })
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  respuestas!: AnswerItemDto[];
}
