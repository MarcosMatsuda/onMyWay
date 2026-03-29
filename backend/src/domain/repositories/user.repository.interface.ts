import { User } from '../entities/user.entity';

export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findBySchoolId(schoolId: string): Promise<User[]>;
  create(
    data: Omit<User, 'id' | 'createdAt'> & { passwordHash: string },
  ): Promise<User>;
  delete(id: string): Promise<void>;
  validateCredentials(email: string, password: string): Promise<User | null>;
}
