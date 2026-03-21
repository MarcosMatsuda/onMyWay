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
    const model = this.repository.create(
      LocationMapper.toPersistence(location),
    );
    const saved = await this.repository.save(model);
    return LocationMapper.toDomain(saved);
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
}
