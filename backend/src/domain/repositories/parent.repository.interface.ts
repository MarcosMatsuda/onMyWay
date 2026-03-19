import { Parent } from '../entities/parent.entity';

export const PARENT_REPOSITORY = 'PARENT_REPOSITORY';

export interface IParentRepository {
  findById(id: string): Promise<Parent | null>;
  findByEmail(email: string): Promise<Parent | null>;
  findBySchoolId(schoolId: string): Promise<Parent[]>;
  create(
    data: Omit<Parent, 'id' | 'createdAt'> & { passwordHash: string },
  ): Promise<Parent>;
  update(id: string, data: Partial<Parent>): Promise<Parent>;
  validateCredentials(email: string, password: string): Promise<Parent | null>;
}
