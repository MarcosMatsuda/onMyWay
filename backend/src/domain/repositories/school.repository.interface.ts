import { School } from '../entities/school.entity';

export const SCHOOL_REPOSITORY = 'SCHOOL_REPOSITORY';

export interface ISchoolRepository {
  findById(id: string): Promise<School | null>;
  create(data: Omit<School, 'id' | 'createdAt'>): Promise<School>;
  update(id: string, data: Partial<School>): Promise<School>;
}
