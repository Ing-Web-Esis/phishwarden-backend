import {
  Controller,
  ForbiddenException,
  Get,
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
import { GetDepartmentsUseCase } from '../application/get-departments.use-case';

type AuthenticatedRequest = Request & {
  user: { empresaId?: number };
};

@ApiTags('departamentos')
@Controller('departamentos')
export class AdminDepartamentosController {
  constructor(
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener estadísticas de departamentos del administrador autenticado',
  })
  @ApiResponse({ status: 200, description: 'Estadísticas de departamentos.' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
  @ApiResponse({ status: 403, description: 'El administrador no tiene empresa asignada.' })
  async getAdminDepartmentStats(@Req() request: AuthenticatedRequest) {
    if (!request.user.empresaId) {
      throw new ForbiddenException('El administrador no tiene una empresa asignada');
    }

    return this.getDepartmentsUseCase.getStats(request.user.empresaId);
  }
}
