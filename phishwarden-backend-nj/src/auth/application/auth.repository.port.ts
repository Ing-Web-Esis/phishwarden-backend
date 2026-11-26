import { UserEntity } from '../domain/user.entity';

export interface AuthRepositoryPort {
  findByEmail(email: string): Promise<{
    id: number;
    email: string;
    passwordHash: string;
    role: string;
    empresaId?: number;
  } | null>;
  findAdminCredentialsById(id: number): Promise<{
    id: number;
    passwordHash: string;
  } | null>;
  updateAdminProfile(
    id: number,
    data: {
      nombre?: string;
      correo?: string;
      nombreEmpresa?: string;
      passwordHash?: string;
    },
  ): Promise<void>;
  findAdminProfileById(id: number): Promise<{
    id: string;
    nombre: string;
    correo: string;
    empresaId: number | null;
    empresa: { id: number; nombre: string } | null;
  } | null>;
  findCompanyByCode(code: string): Promise<{ id: number; name: string } | null>;
  findUserByEmailAndCompany(email: string, empresaId: number): Promise<UserEntity | null>;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');