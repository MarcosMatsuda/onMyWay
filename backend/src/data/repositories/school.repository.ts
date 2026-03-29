import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolModel } from '../models/school.model';
import { SchoolMapper } from '../mappers/school.mapper';
import { ISchoolRepository } from '../../domain/repositories/school.repository.interface';
import { School } from '../../domain/entities/school.entity';

@Injectable()
export class SchoolRepository implements ISchoolRepository {
  constructor(
    @InjectRepository(SchoolModel)
    private readonly schoolRepository: Repository<SchoolModel>,
  ) {}

  async findById(id: string): Promise<School | null> {
    const model = await this.schoolRepository.findOne({ where: { id } });
    return model ? SchoolMapper.toDomain(model) : null;
  }

  async create(data: Omit<School, 'id' | 'createdAt'>): Promise<School> {
    const modelData = SchoolMapper.toPersistence(data);
    const model = this.schoolRepository.create(modelData);
    const savedModel = await this.schoolRepository.save(model);
    return SchoolMapper.toDomain(savedModel);
  }

  async findAll(): Promise<School[]> {
    const models = await this.schoolRepository.find();
    return models.map(SchoolMapper.toDomain);
  }

  async update(id: string, data: Partial<School>): Promise<School> {
    await this.schoolRepository.update(id, data);
    const updatedModel = await this.schoolRepository.findOne({ where: { id } });
    if (!updatedModel) {
      throw new Error(`School with id ${id} not found after update`);
    }
    return SchoolMapper.toDomain(updatedModel);
  }

  async delete(id: string): Promise<void> {
    await this.schoolRepository.delete(id);
  }

  async findByInviteCode(inviteCode: string): Promise<School | null> {
    const model = await this.schoolRepository.findOne({
      where: { inviteCode },
    });
    return model ? SchoolMapper.toDomain(model) : null;
  }

  async findParentsWithinGeofence(schoolId: string): Promise<string[]> {
    // Get school to get its location and geofence radius
    const school = await this.findById(schoolId);
    if (!school) {
      throw new Error(`School with id ${schoolId} not found`);
    }

    // Query to find parents within the school's geofence radius using PostGIS
    // Uses correct coordinate order: (longitude, latitude)
    const query = `
      SELECT DISTINCT p.id
      FROM parents p
      JOIN locations l ON p.id = l.parent_id
      WHERE p.school_id = $1
        AND l.id = (
          SELECT id FROM locations 
          WHERE parent_id = p.id 
          ORDER BY timestamp DESC 
          LIMIT 1
        )
        AND ST_Distance(
          ST_MakePoint($2, $3)::geography,
          ST_MakePoint(l.lng, l.lat)::geography
        ) <= $4
    `;

    try {
      const result = await this.schoolRepository.query(query, [
        schoolId,
        school.lng,
        school.lat,
        school.geofenceRadiusMeters,
      ]);
      return result.map((row: any) => row.id);
    } catch (error) {
      // Fallback for development without PostGIS
      console.warn(
        'PostGIS not available, using simplified query:',
        error.message,
      );

      // Simplified query without spatial filtering
      const fallbackQuery = `
        SELECT DISTINCT p.id
        FROM parents p
        WHERE p.school_id = $1
      `;

      const result = await this.schoolRepository.query(fallbackQuery, [
        schoolId,
      ]);
      return result.map((row: any) => row.id);
    }
  }
}
