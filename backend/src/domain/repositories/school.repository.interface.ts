import { School } from '../entities/school.entity';

export const SCHOOL_REPOSITORY = 'SCHOOL_REPOSITORY';

export interface ISchoolRepository {
  findById(id: string): Promise<School | null>;
  create(data: Omit<School, 'id' | 'createdAt'>): Promise<School>;
  findAll(): Promise<School[]>;
  update(id: string, data: Partial<School>): Promise<School>;
  delete(id: string): Promise<void>;

  // TASK-011: Geofence query capabilities
  findParentsWithinGeofence(schoolId: string): Promise<string[]>;
}
