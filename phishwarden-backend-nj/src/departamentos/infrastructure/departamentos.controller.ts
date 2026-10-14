import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetDepartmentsUseCase } from '../application/get-departments.use-case';
import { CreateDepartmentUseCase } from '../application/create-department.use-case';
import { CreateDepartmentDto } from './create-department.dto';

@ApiTags('departamentos')
@Controller('empresas/:empresaId/departamentos')
export class DepartamentosController {
  constructor(
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar departamentos de una empresa' })
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