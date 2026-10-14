import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCampaignsUseCase } from '../application/get-campaigns.use-case';
import { GetCampaignByIdUseCase } from '../application/get-campaign-by-id.use-case';
import { CreateCampaignUseCase } from '../application/create-campaign.use-case';
import { CancelCampaignUseCase } from '../application/cancel-campaign.use-case';

import { CreateCampaignDto } from './create-campaign.dto';
import { GetCampaignsQueryDto } from './get-campaigns-query.dto';

@ApiTags('campanas')
@Controller('empresas/:empresaId/campanas')
export class CampanasController {
  constructor(
    private readonly getCampaignsUseCase: GetCampaignsUseCase,
    private readonly getCampaignByIdUseCase: GetCampaignByIdUseCase,
    private readonly createCampaignUseCase: CreateCampaignUseCase,
    private readonly cancelCampaignUseCase: CancelCampaignUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar campañas de phishing de la empresa' })
  async getCampaigns(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: GetCampaignsQueryDto,
  ) {
    return this.getCampaignsUseCase.execute(empresaId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una campaña por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de la campaña encontrado.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada o no pertenece a la empresa.' })
  async getCampaignById(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id') id: string,
  ) {
    return this.getCampaignByIdUseCase.execute(id, empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear y programar una nueva campaña de simulación' })
  @ApiResponse({ status: 201, description: 'Campaña programada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o usuarios fuera de la empresa.' })
  async createCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.createCampaignUseCase.execute(empresaId, dto);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una campaña en curso o programada' })
  async cancelCampaign(@Param('id') id: string) {
    return this.cancelCampaignUseCase.execute(id);
  }
}