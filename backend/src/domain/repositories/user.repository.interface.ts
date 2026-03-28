import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(
    data: Omit<User, 'id' | 'createdAt'> & { passwordHash: string },
  ): Promise<User>;
  validateCredentials(email: string, password: string): Promise<User | null>;
}
