import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  Query,
  Body,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BulkImportEmployeesUseCase } from '../application/bulk-import-employees.use-case';
import { GetEmployeesUseCase } from '../application/get-employees.use-case';
import { CreateEmployeeUseCase } from '../application/create-employee.use-case';
import { UpdateEmployeeUseCase } from '../application/update-employee.use-case';
import { DeleteEmployeeUseCase } from '../application/delete-employee.use-case';
import { GetEmployeesSummaryUseCase } from '../application/get-employees-summary.use-case';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from '../../auth/infrastructure/company-tenant.guard';

import { CreateEmployeeDto } from './create-employee.dto';
import { UpdateEmployeeDto } from './update-employee.dto';
import { GetEmployeesQueryDto } from './get-employees-query.dto';

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('empleados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CompanyTenantGuard)
@ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
@ApiResponse({ status: 403, description: 'Acceso denegado a los datos de la empresa.' })
@Controller('empresas/:empresaId/empleados')
export class EmpleadosController {
  constructor(
    private readonly bulkImportEmployeesUseCase: BulkImportEmployeesUseCase,
    private readonly getEmployeesUseCase: GetEmployeesUseCase,
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
    private readonly updateEmployeeUseCase: UpdateEmployeeUseCase,
    private readonly deleteEmployeeUseCase: DeleteEmployeeUseCase,
    private readonly getEmployeesSummaryUseCase: GetEmployeesSummaryUseCase,
  ) {}

  @Post('import-csv')
  @ApiOperation({
    summary: 'Carga masiva de empleados mediante archivo CSV',
    description:
      'Procesa un CSV con formato: nombre,correo,departamento,telefono(opcional).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo CSV (delimitado por comas o punto y coma)',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Resumen de importación masiva.' })
  @UseInterceptors(FileInterceptor('file'))
  async bulkImportCsv(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @UploadedFile() file: FileUpload,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Debes adjuntar un archivo CSV válido.');
    }

    return this.bulkImportEmployeesUseCase.execute(empresaId, file.buffer);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de empleados paginada con filtros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de empleados obtenida con éxito.' })
  async getEmployees(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: GetEmployeesQueryDto,
  ) {
    return this.getEmployeesUseCase.execute(empresaId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar un empleado individualmente' })
  @ApiResponse({ status: 201, description: 'Empleado registrado exitosamente.' })
  async createEmployee(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.createEmployeeUseCase.execute(empresaId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar la información de un empleado' })
  @ApiResponse({ status: 200, description: 'Empleado actualizado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado.' })
  async updateEmployee(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.updateEmployeeUseCase.execute(empresaId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un empleado de la organización' })
  @ApiResponse({ status: 200, description: 'Empleado eliminado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado.' })
  async deleteEmployee(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deleteEmployeeUseCase.execute(empresaId, id);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener lista resumida y paginada de empleados (nombre, correo, departamento y score)' })
  @ApiResponse({ status: 200, description: 'Resumen paginado obtenido con éxito.' })
  async getEmployeesSummary(
    @Param('empresaId', ParseIntPipe) empresaId: number,
    @Query() query: GetEmployeesQueryDto,
  ) {
    return this.getEmployeesSummaryUseCase.execute(empresaId, query);
  }
}