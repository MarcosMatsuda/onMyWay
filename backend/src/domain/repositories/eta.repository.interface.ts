import { ETA } from '../entities/eta.entity';

export const ETA_REPOSITORY = 'ETA_REPOSITORY';

export interface IETARepository {
  save(eta: Omit<ETA, 'id'>): Promise<ETA>;
  findLatestByParentId(
    parentId: string,
    maxAgeMinutes?: number,
  ): Promise<ETA | null>;
  findBySchoolId(schoolId: string): Promise<ETA[]>;
  findLatestBulkByParentIds(
    parentIds: string[],
    maxAgeMinutes?: number,
  ): Promise<Map<string, ETA>>;
  deleteByParentId(parentId: string): Promise<void>;
}
