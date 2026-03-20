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

  async findParentsNearSchool(schoolId: string): Promise<string[]> {
    // This is a simplified implementation for MVP
    // In production, use PostGIS or similar for spatial queries
    const query = `
      SELECT DISTINCT l.parent_id
      FROM locations l
      JOIN parents p ON l.parent_id = p.id
      WHERE p.school_id = $1
      ORDER BY l.timestamp DESC
      LIMIT 100
    `;

    const result = await this.repository.query(query, [schoolId]);
    return result.map((row: any) => row.parent_id);
  }
}
