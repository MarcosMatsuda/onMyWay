import { Location } from '../entities/location.entity';

export const LOCATION_REPOSITORY = 'LOCATION_REPOSITORY';

export interface ILocationRepository {
  save(location: Omit<Location, 'id'>): Promise<Location>;
  findLatestByParentId(parentId: string): Promise<Location | null>;
  findParentsNearSchool(schoolId: string, radiusMeters: number): Promise<string[]>;
}
