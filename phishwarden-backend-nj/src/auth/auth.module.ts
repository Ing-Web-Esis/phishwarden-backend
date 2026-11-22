import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/auth.controller';
import { LoginUseCase } from './application/login.use-case';
import { PrismaAuthRepository } from './infrastructure/prisma-auth.repository';
import { AUTH_REPOSITORY } from './application/auth.repository.port';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { CompanyTenantGuard } from './infrastructure/company-tenant.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'phishwarden-local-development-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    JwtAuthGuard,
    CompanyTenantGuard,
    {
      provide: AUTH_REPOSITORY,
      useClass: PrismaAuthRepository,
    },
  ],
  exports: [JwtAuthGuard, CompanyTenantGuard, JwtModule],
})
export class AuthModule {}