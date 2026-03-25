import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LocationModel } from '../models/location.model';
import { LocationMapper } from '../mappers/location.mapper';
import { Location } from '../../domain/entities/location.entity';
import { ILocationRepository } from '../../domain/repositories/location.repository.interface';

@Injectable()
export class LocationRepository implements ILocationRepository {
  constructor(
    @InjectRepository(LocationModel)
    private readonly repository: Repository<LocationModel>,
    private readonly dataSource: DataSource,
  ) {}

  async save(location: Location | Omit<Location, 'id'>): Promise<Location> {
    const id = 'id' in location ? location.id : crypto.randomUUID();
    await this.dataSource.query(
      `INSERT INTO locations (id, parent_id, lat, lng, accuracy, timestamp) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, location.parentId, location.lat, location.lng, location.accuracy ?? 0, location.timestamp],
    );
    return { ...location, id };
  }

  async findById(id: string): Promise<Location | null> {
    const model = await this.repository.findOne({ where: { id } });
    return model ? LocationMapper.toDomain(model) : null;
  }

  async findLatestByParentId(parentId: string): Promise<Location | null> {
    const model = await this.repository.findOne({
      where: { parentId },
      order: { timestamp: 'DESC' },
    });
    return model ? LocationMapper.toDomain(model) : null;
  }

  async findByParentId(parentId: string): Promise<Location[]> {
    const models = await this.repository.find({
      where: { parentId },
      order: { timestamp: 'DESC' },
    });
    return models.map((model) => LocationMapper.toDomain(model));
  }

  async findParentsNearSchool(schoolId: string): Promise<string[]> {
    // Use PostGIS to find parents whose latest location is within school's geofence radius
    const query = `
      SELECT DISTINCT l.parent_id
      FROM locations l
      JOIN parents p ON l.parent_id = p.id
      JOIN schools s ON p.school_id = s.id
      WHERE s.id = $1
        AND ST_Distance(
          ST_MakePoint(l.lng, l.lat)::geography,
          ST_MakePoint(s.lng, s.lat)::geography
        ) <= s.geofence_radius_meters
        AND l.timestamp = (
          SELECT MAX(l2.timestamp)
          FROM locations l2
          WHERE l2.parent_id = l.parent_id
        )
      ORDER BY l.parent_id
    `;

    const result = await this.dataSource.query(query, [schoolId]);
    return result.map((row: any) => row.parent_id);
  }

  async findLatestBulkByParentIds(
    parentIds: string[],
  ): Promise<Map<string, Location>> {
    if (parentIds.length === 0) {
      return new Map();
    }

    // Get latest location per parent ID
    const models = await this.repository
      .createQueryBuilder('location')
      .where('location.parentId IN (:...parentIds)', { parentIds })
      .orderBy('location.parentId', 'ASC')
      .addOrderBy('location.timestamp', 'DESC')
      .getMany();

    // Group by parentId, keeping only the latest (first) per parent
    const resultMap = new Map<string, Location>();
    const seenParentIds = new Set<string>();

    for (const model of models) {
      if (!seenParentIds.has(model.parentId)) {
        resultMap.set(model.parentId, LocationMapper.toDomain(model));
        seenParentIds.add(model.parentId);
      }
    }

    return resultMap;
  }
}
