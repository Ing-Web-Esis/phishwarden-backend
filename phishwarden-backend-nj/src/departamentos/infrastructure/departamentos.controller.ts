import {
  Controller,
  Get,
  Post,
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
} from '@nestjs/swagger';
import { GetDepartmentsUseCase } from '../application/get-departments.use-case';
import { CreateDepartmentUseCase } from '../application/create-department.use-case';
import { CreateDepartmentDto } from './create-department.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

@ApiTags('departamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
@ApiResponse({ status: 403, description: 'Acceso denegado a los datos de la empresa.' })
@Controller('empresas/:empresaId/departamentos')
export class DepartamentosController {
  constructor(
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar departamentos de una empresa' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos obtenida exitosamente.' })
  async getDepartments(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.getDepartmentsUseCase.execute(empresaId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo departamento' })
  @ApiResponse({ status: 201, description: 'Departamento creado exitosamente.' })
  async createDepartment(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.createDepartmentUseCase.execute(empresaId, { name: dto.nombre });
  }
}