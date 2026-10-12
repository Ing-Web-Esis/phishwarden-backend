import { Module } from '@nestjs/common';
import { AuthController } from './infrastructure/auth.controller';
import { LoginUseCase } from './application/login.use-case';
import { PrismaAuthRepository } from './infrastructure/prisma-auth.repository';
import { AUTH_REPOSITORY } from './application/auth.repository.port';

@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    {
      provide: AUTH_REPOSITORY,
      useClass: PrismaAuthRepository,
    },
  ],
})
export class AuthModule {}