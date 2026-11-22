import {
  Controller,
  Post,
  Get,
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
import { RegisterCompanyDto } from './register-company.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly registerCompanyUseCase: RegisterCompanyUseCase,
    private readonly getCompanyByIdUseCase: GetCompanyByIdUseCase,
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
}