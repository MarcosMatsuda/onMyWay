import { Location } from '../entities/location.entity';

export const LOCATION_REPOSITORY = 'LOCATION_REPOSITORY';

export interface ILocationRepository {
  save(location: Omit<Location, 'id'>): Promise<Location>;
  findById(id: string): Promise<Location | null>;
  findLatestByParentId(parentId: string): Promise<Location | null>;
  findByParentId(parentId: string): Promise<Location[]>;
  findParentsNearSchool(schoolId: string): Promise<string[]>;
  findLatestBulkByParentIds(
    parentIds: string[],
  ): Promise<Map<string, Location>>;
}
