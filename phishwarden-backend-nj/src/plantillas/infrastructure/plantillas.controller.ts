import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetTemplatesUseCase } from '../application/get-templates.use-case';
import { CreateTemplateUseCase } from '../application/create-template.use-case';
import { UpdateTemplateUseCase } from '../application/update-template.use-case';
import { DeleteTemplateUseCase } from '../application/delete-template.use-case';

import { CreateTemplateDto } from './create-template.dto';
import { UpdateTemplateDto } from './update-template.dto';
import { GetTemplatesQueryDto } from './get-templates-query.dto';

@ApiTags('plantillas')
@Controller('empresas/:empresaId/plantillas')
export class PlantillasController {
  constructor(
    private readonly getTemplatesUseCase: GetTemplatesUseCase,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly deleteTemplateUseCase: DeleteTemplateUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar plantillas de phishing (Globales + Personalizadas de la empresa)',
  })
  async getTemplates(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: GetTemplatesQueryDto,
  ) {
    return this.getTemplatesUseCase.execute(empresaId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear una plantilla personalizada para la empresa',
  })
  @ApiResponse({ status: 201, description: 'Plantilla creada exitosamente.' })
  async createTemplate(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.createTemplateUseCase.execute(empresaId, dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar una plantilla existente',
  })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.updateTemplateUseCase.execute(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una plantilla personalizada',
  })
  async deleteTemplate(@Param('id') id: string) {
    return this.deleteTemplateUseCase.execute(id);
  }
}