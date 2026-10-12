import { UserEntity } from '../domain/user.entity';

export interface AuthRepositoryPort {
  findByEmail(email: string): Promise<any | null>;
  findCompanyByCode(code: string): Promise<{ id: number; name: string } | null>;
  findUserByEmailAndCompany(email: string, empresaId: number): Promise<UserEntity | null>;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');