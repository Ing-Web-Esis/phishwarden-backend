import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

import { GetCampaignSummaryUseCase } from '../application/get-campaign-summary.use-case';
import { GetCampaignsUseCase } from '../application/get-campaigns.use-case';
import { GetCampaignByIdUseCase } from '../application/get-campaign-by-id.use-case';
import { GetCampaignParticipantsUseCase } from '../application/get-campaign-participants.use-case';
import { CreateCampaignUseCase } from '../application/create-campaign.use-case';
import { UpdateCampaignUseCase } from '../application/update-campaign.use-case';
import { ManageCampaignParticipantsUseCase } from '../application/manage-campaign-participants.use-case';
import { DuplicateCampaignUseCase } from '../application/duplicate-campaign.use-case';
import { CancelCampaignUseCase } from '../application/cancel-campaign.use-case';
import { FinalizeCampaignUseCase } from '../application/finalize-campaign.use-case';
import { DispatchCampaignUseCase } from '../../simulaciones/application/dispatch-campaign.use-case';

import { CreateCampaignDto } from './create-campaign.dto';
import { UpdateCampaignDto } from './update-campaign.dto';
import { ManageParticipantsDto } from './manage-participants.dto';
import { DuplicateCampaignDto } from './duplicate-campaign.dto';
import { GetCampaignsQueryDto } from './get-campaigns-query.dto';
import { GetParticipantsQueryDto } from './get-participants-query.dto';

@ApiTags('campanas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
@ApiResponse({ status: 403, description: 'Acceso denegado a los datos de la empresa.' })
@Controller('empresas/:empresaId/campanas')
export class CampanasController {
  constructor(
    private readonly getCampaignSummaryUseCase: GetCampaignSummaryUseCase,
    private readonly getCampaignsUseCase: GetCampaignsUseCase,
    private readonly getCampaignByIdUseCase: GetCampaignByIdUseCase,
    private readonly getCampaignParticipantsUseCase: GetCampaignParticipantsUseCase,
    private readonly createCampaignUseCase: CreateCampaignUseCase,
    private readonly updateCampaignUseCase: UpdateCampaignUseCase,
    private readonly manageCampaignParticipantsUseCase: ManageCampaignParticipantsUseCase,
    private readonly duplicateCampaignUseCase: DuplicateCampaignUseCase,
    private readonly cancelCampaignUseCase: CancelCampaignUseCase,
    private readonly finalizeCampaignUseCase: FinalizeCampaignUseCase,
    private readonly dispatchCampaignUseCase: DispatchCampaignUseCase,
  ) {}

  // 1. Resumen ejecutivo de estados (Ruta estática ANTES de :id)
  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen ejecutivo con contadores por estado de campañas' })
  @ApiResponse({ status: 200, description: 'Resumen de campañas obtenido exitosamente.' })
  async getSummary(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.getCampaignSummaryUseCase.execute(empresaId);
  }

  // 2. Listado paginado de campañas
  @Get()
  @ApiOperation({ summary: 'Listar campañas de la empresa con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de campañas obtenida exitosamente.' })
  async getCampaigns(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: GetCampaignsQueryDto,
  ) {
    return this.getCampaignsUseCase.execute(empresaId, query);
  }

  // 3. Participantes de una campaña (Ruta compuesta antes de :id simple)
  @Get(':id/participantes')
  @ApiOperation({ summary: 'Listar colaboradores participantes asignados a una campaña' })
  @ApiResponse({ status: 200, description: 'Lista paginada de participantes obtenida exitosamente.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada o no pertenece a la empresa.' })
  async getParticipants(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetParticipantsQueryDto,
  ) {
    return this.getCampaignParticipantsUseCase.execute(id, empresaId, query);
  }

  // 4. Detalle de campaña por ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle general de una campaña y su plantilla' })
  @ApiResponse({ status: 200, description: 'Detalle de la campaña encontrado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada o no pertenece a la empresa.' })
  async getCampaignById(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.getCampaignByIdUseCase.execute(id, empresaId);
  }

  // 5. Creación atómica de campaña
  @Post()
  @ApiOperation({ summary: 'Crear y programar atómicamente una nueva campaña' })
  @ApiResponse({ status: 201, description: 'Campaña programada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos, plantilla no autorizada o usuarios fuera de la empresa.' })
  async createCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.createCampaignUseCase.execute(empresaId, dto);
  }

  // 6. Agregar participantes a campaña programada
  @Post(':id/participantes')
  @ApiOperation({ summary: 'Agregar participantes o departamentos adicionales a una campaña programada' })
  @ApiResponse({ status: 200, description: 'Participantes agregados exitosamente.' })
  @ApiResponse({ status: 400, description: 'Campaña no está programada o colaboradores inválidos.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada.' })
  async addParticipants(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageParticipantsDto,
  ) {
    return this.manageCampaignParticipantsUseCase.addParticipants(id, empresaId, dto);
  }

  // 7. Remover participante de campaña programada
  @Delete(':id/participantes/:usuarioId')
  @ApiOperation({ summary: 'Remover un colaborador objetivo de una campaña programada' })
  @ApiResponse({ status: 200, description: 'Colaborador retirado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Campaña no está programada o se intenta remover al último participante.' })
  @ApiResponse({ status: 404, description: 'Campaña o colaborador no encontrado.' })
  async removeParticipant(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('usuarioId', ParseUUIDPipe) usuarioId: string,
  ) {
    return this.manageCampaignParticipantsUseCase.removeParticipant(id, empresaId, usuarioId);
  }

  // 8. Clonar / Duplicar campaña
  @Post(':id/duplicar')
  @ApiOperation({ summary: 'Duplicar una campaña existente como nueva campaña programada' })
  @ApiResponse({ status: 201, description: 'Campaña duplicada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Plantilla original no disponible.' })
  @ApiResponse({ status: 404, description: 'Campaña origen no encontrada.' })
  async duplicateCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DuplicateCampaignDto,
  ) {
    return this.duplicateCampaignUseCase.execute(id, empresaId, dto);
  }

  // 9. Cancelar campaña
  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una campaña en curso o programada' })
  @ApiResponse({ status: 200, description: 'Campaña cancelada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Campaña ya finalizada o cancelada.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada o no pertenece a la empresa.' })
  async cancelCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cancelCampaignUseCase.execute(id, empresaId);
  }

  // 10. Finalizar manualmente campaña en curso
  @Patch(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar manualmente una campaña en curso' })
  @ApiResponse({ status: 200, description: 'Campaña finalizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Solo se pueden finalizar campañas que se encuentren en curso.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada o no pertenece a la empresa.' })
  async finalizeCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.finalizeCampaignUseCase.execute(id, empresaId);
  }

  // 11. Despachar campaña inmediatamente
  @Post(':id/despachar')
  @ApiOperation({ summary: 'Despachar inmediatamente una campaña programada (envío atómico masivo o escalonado)' })
  @ApiResponse({ status: 200, description: 'Campaña despachada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Campaña no puede ser despachada o no tiene participantes.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada, no pertenece a la empresa o no está programada.' })
  async dispatchCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dispatchCampaignUseCase.execute(id, empresaId);
  }

  // 10. Edición de metadatos de campaña programada
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar metadatos de una campaña programada' })
  @ApiResponse({ status: 200, description: 'Campaña actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Campaña no está programada o datos inválidos.' })
  @ApiResponse({ status: 404, description: 'Campaña no encontrada o no pertenece a la empresa.' })
  async updateCampaign(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.updateCampaignUseCase.execute(id, empresaId, dto);
  }
}
