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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetTemplatesUseCase } from '../application/get-templates.use-case';
import { CreateTemplateUseCase } from '../application/create-template.use-case';
import { UpdateTemplateUseCase } from '../application/update-template.use-case';
import { DeleteTemplateUseCase } from '../application/delete-template.use-case';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

import { CreateTemplateDto } from './create-template.dto';
import { UpdateTemplateDto } from './update-template.dto';
import { GetTemplatesQueryDto } from './get-templates-query.dto';

@ApiTags('plantillas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
@ApiResponse({ status: 403, description: 'Acceso denegado a los datos de la empresa o recurso protegido.' })
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
  @ApiResponse({ status: 200, description: 'Lista paginada de plantillas obtenida con éxito.' })
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
  @ApiResponse({ status: 200, description: 'Plantilla actualizada exitosamente.' })
  @ApiResponse({ status: 403, description: 'No se pueden modificar plantillas globales del sistema o de otra empresa.' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada.' })
  async updateTemplate(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.updateTemplateUseCase.execute(empresaId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar una plantilla personalizada',
  })
  @ApiResponse({ status: 200, description: 'Plantilla eliminada exitosamente.' })
  @ApiResponse({ status: 403, description: 'No se pueden eliminar plantillas globales del sistema o de otra empresa.' })
  @ApiResponse({ status: 404, description: 'Plantilla no encontrada.' })
  async deleteTemplate(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deleteTemplateUseCase.execute(empresaId, id);
  }
}