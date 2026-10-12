import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RegisterCompanyUseCase } from '../application/register-company.use-case';
import { RegisterCompanyDto } from './register-company.dto';

@ApiTags('empresas')
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly registerCompanyUseCase: RegisterCompanyUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo administrador principal' })
  @ApiBody({ type: RegisterCompanyDto })
  @ApiResponse({ status: 201, description: 'Administrador registrado exitosamente.' })
  @ApiResponse({ status: 409, description: 'El correo corporativo ya se encuentra registrado.' })
  async register(@Body() dto: RegisterCompanyDto) {
    return this.registerCompanyUseCase.execute(dto);
  }
}