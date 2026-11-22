import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface EmployeeJwtPayload {
  sub: string;
  usuarioId: string;
  empresaId: number;
  correo: string;
  role: string;
}

export type AuthenticatedEmployeeRequest = Request & {
  user: EmployeeJwtPayload;
};

@Injectable()
export class EmployeeJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedEmployeeRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Se requiere un token Bearer para acceder a la aplicación móvil.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<EmployeeJwtPayload>(token);

      if (payload.role !== 'EMPLOYEE' || !payload.usuarioId) {
        throw new ForbiddenException(
          'Acceso denegado: este recurso está restringido exclusivamente a colaboradores móviles.',
        );
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Token móvil inválido, ausente o expirado.');
    }
  }
}
