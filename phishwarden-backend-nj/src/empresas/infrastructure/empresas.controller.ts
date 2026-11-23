import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RegisterCompanyUseCase } from '../application/register-company.use-case';
import { GetCompanyByIdUseCase } from '../application/get-company-by-id.use-case';
import { UpdateCompanyUseCase } from '../application/update-company.use-case';
import { RegenerateAccessCodeUseCase } from '../application/regenerate-access-code.use-case';
import { RegisterCompanyDto } from './register-company.dto';
import { UpdateCompanyDto } from './update-company.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly registerCompanyUseCase: RegisterCompanyUseCase,
    private readonly getCompanyByIdUseCase: GetCompanyByIdUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly regenerateAccessCodeUseCase: RegenerateAccessCodeUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo administrador principal' })
  @ApiBody({ type: RegisterCompanyDto })
  @ApiResponse({ status: 201, description: 'Administrador registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'El correo corporativo ya se encuentra registrado.' })
  async register(@Body() dto: RegisterCompanyDto) {
    return this.registerCompanyUseCase.execute(dto);
  }

  @Get(':empresaId')
  @UseGuards(JwtAuthGuard, CompanyTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar detalles de la empresa incluyendo su código de acceso' })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({ status: 200, description: 'Detalle de la empresa con código de acceso.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra organización.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  async getById(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.getCompanyByIdUseCase.execute(empresaId);
  }

  @Patch(':empresaId')
  @UseGuards(JwtAuthGuard, CompanyTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar datos de la organización' })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Organización actualizada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra organización.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  async update(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.updateCompanyUseCase.execute(empresaId, dto);
  }

  @Post(':empresaId/regenerar-codigo')
  @UseGuards(JwtAuthGuard, CompanyTenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerar el código de acceso institucional para enrolamiento móvil' })
  @ApiParam({ name: 'empresaId', type: Number, description: 'ID de la empresa' })
  @ApiResponse({ status: 200, description: 'Código de acceso regenerado exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token ausente o inválido.' })
  @ApiResponse({ status: 403, description: 'Acceso denegado a otra organización.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  async regenerateAccessCode(
    @Param('empresaId', ParseIntPipe) empresaId: number,
  ) {
    return this.regenerateAccessCodeUseCase.execute(empresaId);
  }
}
