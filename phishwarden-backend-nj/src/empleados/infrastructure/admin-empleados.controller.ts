import {
  Controller,
  NotFoundException,
  ForbiddenException,
  Get,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { GetEmployeesUseCase } from '../application/get-employees.use-case';

type AuthenticatedRequest = Request & {
  user: { empresaId?: number };
};

@ApiTags('empleados')
@Controller('empleados')
export class AdminEmpleadosController {
  constructor(
    private readonly getEmployeesUseCase: GetEmployeesUseCase,
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener un empleado de la empresa del administrador autenticado',
  })
  @ApiResponse({ status: 200, description: 'Información del empleado.' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
  @ApiResponse({ status: 403, description: 'El administrador no tiene empresa asignada.' })
  @ApiResponse({ status: 404, description: 'Empleado no encontrado.' })
  async getAdminEmployee(
    @Param('id') employeeId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (!request.user.empresaId) {
      throw new ForbiddenException('El administrador no tiene una empresa asignada');
    }

    const employee = await this.getEmployeesUseCase.getAdminEmployee(
      request.user.empresaId,
      employeeId,
    );

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    return employee;
  }
}
