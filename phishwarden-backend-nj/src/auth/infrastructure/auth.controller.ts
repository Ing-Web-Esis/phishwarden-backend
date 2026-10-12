import { Controller, Post, Body } from '@nestjs/common';
import { LoginUseCase } from '../application/login.use-case';
import { LoginDto } from './login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

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
}