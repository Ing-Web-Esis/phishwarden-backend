import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

interface AuthenticatedUser {
  sub: number;
  role?: string;
  empresaId?: number;
}

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class CompanyTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (user.role !== 'administrador') {
      throw new ForbiddenException(
        'Acceso restringido a administradores web de la organización',
      );
    }

    if (user.empresaId === undefined || user.empresaId === null) {
      throw new ForbiddenException(
        'El administrador autenticado no tiene una empresa asignada',
      );
    }

    const rawEmpresaId = request.params?.empresaId;
    if (rawEmpresaId !== undefined) {
      const paramStr = Array.isArray(rawEmpresaId)
        ? rawEmpresaId[0]
        : String(rawEmpresaId);
      const routeEmpresaId = parseInt(paramStr, 10);
      if (isNaN(routeEmpresaId) || Number(user.empresaId) !== routeEmpresaId) {
        throw new ForbiddenException(
          'Acceso denegado: no tienes permisos para acceder a los datos de esta empresa',
        );
      }
    }

    return true;
  }
}
