import { Parent } from '../entities/parent.entity';

export const PARENT_REPOSITORY = 'PARENT_REPOSITORY';

export interface IParentRepository {
  findById(id: string): Promise<Parent | null>;
  findByEmail(email: string): Promise<Parent | null>;
  findBySchoolId(schoolId: string): Promise<Parent[]>;
  findByIds(ids: string[]): Promise<Map<string, Parent>>;
  create(
    data: Omit<Parent, 'id' | 'createdAt'> & { passwordHash: string },
  ): Promise<Parent>;
  update(id: string, data: Partial<Parent>): Promise<Parent>;
  delete(id: string): Promise<void>;
  validateCredentials(email: string, password: string): Promise<Parent | null>;
}
