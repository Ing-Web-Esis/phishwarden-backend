import { Controller, Post, Body, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../application/login.use-case';
import { LoginDto } from './login.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user: { sub: number };
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto }) // Esto fuerza a Swagger a mostrar los campos del formulario
  @ApiResponse({ status: 201, description: 'Autenticación exitosa.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o faltan parámetros.' })
  async login(@Body() loginDto: LoginDto) {
    return this.loginUseCase.execute(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil del administrador autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del administrador.' })
  @ApiResponse({ status: 401, description: 'Token ausente, inválido o expirado.' })
  async me(@Req() request: AuthenticatedRequest) {
    const profile = await this.loginUseCase.getAdminProfile(request.user.sub);
    if (!profile) {
      throw new UnauthorizedException('Administrador no encontrado');
    }
    return profile;
  }
}