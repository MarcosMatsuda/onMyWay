import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationModel } from '../models/location.model';
import { LocationMapper } from '../mappers/location.mapper';
import { Location } from '../../domain/entities/location.entity';
import { ILocationRepository } from '../../domain/repositories/location.repository.interface';

@Injectable()
export class LocationRepository implements ILocationRepository {
  constructor(
    @InjectRepository(LocationModel)
    private readonly repository: Repository<LocationModel>,
  ) {}

  async save(location: Omit<Location, 'id'>): Promise<Location> {
    const model = this.repository.create(
      LocationMapper.toPersistence(location),
    );
    const saved = await this.repository.save(model);
    return LocationMapper.toDomain(saved);
  }

  async findLatestByParentId(parentId: string): Promise<Location | null> {
    const model = await this.repository.findOne({
      where: { parentId },
      order: { timestamp: 'DESC' },
    });
    return model ? LocationMapper.toDomain(model) : null;
  }

  async findParentsNearSchool(
    schoolId: string,
    radiusMeters: number,
  ): Promise<string[]> {
    // Use PostGIS to find parents within radius of school
    // First get school location
    const schoolQuery = `
      SELECT location
      FROM schools
      WHERE id = $1
    `;

    const schoolResult = await this.repository.query(schoolQuery, [schoolId]);

    if (
      !schoolResult ||
      schoolResult.length === 0 ||
      !schoolResult[0].location
    ) {
      return [];
    }

    // Find latest location for each parent within radius
    const query = `
      WITH latest_locations AS (
        SELECT DISTINCT ON (parent_id) 
          parent_id,
          point,
          timestamp
        FROM locations
        WHERE point IS NOT NULL
        ORDER BY parent_id, timestamp DESC
      )
      SELECT DISTINCT ll.parent_id
      FROM latest_locations ll
      WHERE ST_DWithin(
        ll.point::geography,
        $1::geography,
        $2
      )
      ORDER BY ll.timestamp DESC
      LIMIT 100
    `;

    const result = await this.repository.query(query, [
      schoolResult[0].location,
      radiusMeters,
    ]);
    return result.map((row: any) => row.parent_id);
  }
}
