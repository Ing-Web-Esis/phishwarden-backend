import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';
import { GetPortalsUseCase } from '../application/get-portals.use-case';
import { GetPortalByIdUseCase } from '../application/get-portal-by-id.use-case';
import { CreatePortalUseCase } from '../application/create-portal.use-case';
import { UpdatePortalUseCase } from '../application/update-portal.use-case';
import { DeletePortalUseCase } from '../application/delete-portal.use-case';
import { CreatePortalDto } from './create-portal.dto';
import { UpdatePortalDto } from './update-portal.dto';

@ApiTags('portales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
@ApiResponse({ status: 403, description: 'Acceso denegado a los datos de la empresa o recurso protegido.' })
@Controller('empresas/:empresaId/portales')
export class PortalesController {
  constructor(
    private readonly getPortalsUseCase: GetPortalsUseCase,
    private readonly getPortalByIdUseCase: GetPortalByIdUseCase,
    private readonly createPortalUseCase: CreatePortalUseCase,
    private readonly updatePortalUseCase: UpdatePortalUseCase,
    private readonly deletePortalUseCase: DeletePortalUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar portales simulados (Globales del sistema y Propios de la empresa)',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa autenticada' })
  @ApiResponse({ status: 200, description: 'Lista de portales obtenida con éxito.' })
  async getPortals(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.getPortalsUseCase.execute(empresaId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de un portal simulado accesible por la empresa',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa autenticada' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del portal simulado' })
  @ApiResponse({ status: 200, description: 'Portal simulado encontrado.' })
  @ApiResponse({ status: 404, description: 'Portal no encontrado o no autorizado.' })
  async getPortalById(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.getPortalByIdUseCase.execute(id, empresaId);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un portal simulado personalizado para la organización',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa autenticada' })
  @ApiResponse({ status: 201, description: 'Portal simulado creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos en el formulario.' })
  async createPortal(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreatePortalDto,
  ) {
    return this.createPortalUseCase.execute(empresaId, dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar un portal simulado personalizado propio',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa autenticada' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del portal simulado' })
  @ApiResponse({ status: 200, description: 'Portal actualizado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 403, description: 'Los portales globales del sistema no pueden ser modificados.' })
  @ApiResponse({ status: 404, description: 'Portal no encontrado.' })
  async updatePortal(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePortalDto,
  ) {
    return this.updatePortalUseCase.execute(id, empresaId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un portal simulado personalizado propio',
  })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa autenticada' })
  @ApiParam({ name: 'id', type: Number, description: 'ID del portal simulado' })
  @ApiResponse({ status: 200, description: 'Portal eliminado exitosamente.' })
  @ApiResponse({ status: 403, description: 'Los portales globales del sistema no pueden ser eliminados.' })
  @ApiResponse({ status: 404, description: 'Portal no encontrado.' })
  async deletePortal(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.deletePortalUseCase.execute(id, empresaId);
  }
}
