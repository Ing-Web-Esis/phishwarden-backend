import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { TrackOpenUseCase, TRANSPARENT_GIF_1X1 } from '../application/track-open.use-case';
import { TrackClickUseCase } from '../application/track-click.use-case';
import { GetSimulationContextUseCase } from '../application/get-simulation-context.use-case';
import { TrackSubmitUseCase } from '../application/track-submit.use-case';
import { TrackSubmitDto } from './track-submit.dto';

function extractClientMetadata(req: Request): { ip: string; userAgent: string } {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = req.ip || '';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  }
  const userAgent = (req.headers['user-agent'] as string) || '';
  return { ip, userAgent };
}

@ApiTags('tracking')
@Controller('track')
export class TrackingController {
  constructor(
    private readonly trackOpenUseCase: TrackOpenUseCase,
    private readonly trackClickUseCase: TrackClickUseCase,
    private readonly getSimulationContextUseCase: GetSimulationContextUseCase,
    private readonly trackSubmitUseCase: TrackSubmitUseCase,
  ) {}

  @Get('open/:token')
  @ApiOperation({
    summary: 'Rastreo de apertura de correo de simulación (Pixel GIF 1x1)',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único UUIDv4 asignado al colaborador en la campaña',
  })
  @ApiResponse({
    status: 200,
    description: 'Pixel transparente 1x1 devuelto con cabeceras de no-caché.',
  })
  async trackOpen(
    @Param('token', new ParseUUIDPipe({ version: '4' })) token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { ip, userAgent } = extractClientMetadata(req);
    const gifBuffer = await this.trackOpenUseCase.execute(token, ip, userAgent);

    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', String(gifBuffer.length));
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.end(gifBuffer);
  }

  @Get('click/:token')
  @ApiOperation({
    summary: 'Rastreo de clic en enlace de simulación y redirección a landing de verificación',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único UUIDv4 asignado al colaborador en la campaña',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección HTTP 302 a la landing de verificación de simulación.',
  })
  async trackClick(
    @Param('token', new ParseUUIDPipe({ version: '4' })) token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { ip, userAgent } = extractClientMetadata(req);
    const redirectUrl = await this.trackClickUseCase.execute(token, ip, userAgent);
    return res.redirect(HttpStatus.FOUND, redirectUrl);
  }

  @Get('context/:token')
  @ApiOperation({
    summary: 'Obtener metadatos no sensibles de la simulación para la landing page',
  })
  @ApiParam({
    name: 'token',
    description: 'Token único UUIDv4 asignado al colaborador en la campaña',
  })
  @ApiResponse({
    status: 200,
    description: 'Contexto no sensible de la simulación obtenido exitosamente.',
  })
  @ApiResponse({
    status: 404,
    description: 'Simulación inexistente, cancelada o token inválido.',
  })
  async getContext(
    @Param('token', new ParseUUIDPipe({ version: '4' })) token: string,
  ) {
    return this.getSimulationContextUseCase.execute(token);
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @ApiOperation({
    summary: 'Registro de envío de formulario de credenciales simuladas (Zero-Credential Storage)',
  })
  @ApiBody({ type: TrackSubmitDto })
  @ApiResponse({
    status: 200,
    description: 'Envío de simulación registrado exitosamente y feedback educativo entregado.',
  })
  @ApiResponse({
    status: 400,
    description: 'El payload es inválido o contiene credenciales/campos ajenos no autorizados.',
  })
  @ApiResponse({
    status: 404,
    description: 'Simulación inexistente, cancelada o token inválido.',
  })
  async trackSubmit(
    @Body() dto: TrackSubmitDto,
    @Req() req: Request,
  ) {
    const { ip, userAgent } = extractClientMetadata(req);
    return this.trackSubmitUseCase.execute(dto.token, ip, userAgent);
  }
}
