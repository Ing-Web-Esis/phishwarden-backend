import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttackType, DifficultyLevel } from '../domain/template.entity';

export class CreateTemplateDto {
  @ApiProperty({
    example: 'Actualización Urgente de Credenciales Microsoft 365',
    description: 'Título descriptivo de la plantilla para el administrador',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Acción Requerida: Se requiere verificar su cuenta institucional',
    description: 'Asunto que aparecerá en el correo del usuario objetivo',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    example: '<p>Estimado {{nombre}}, detectamos un inicio de sesión inusual.</p>',
    description: 'Cuerpo HTML de la plantilla con placeholders de simulación',
  })
  @IsString()
  @IsNotEmpty()
  bodyHtml: string;

  @ApiProperty({
    enum: AttackType,
    example: AttackType.PHISHING,
    description: 'Vector de ataque de phishing',
  })
  @IsEnum(AttackType)
  attackType: AttackType;

  @ApiProperty({
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIO,
    description: 'Nivel de dificultad del señuelo',
  })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;
}