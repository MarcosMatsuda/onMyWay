import { Injectable } from '@nestjs/common';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';

export interface CreateSchoolInput {
  name: string;
  lat: number;
  lng: number;
  geofenceRadiusMeters?: number;
  notificationThresholdMeters?: number;
}

export interface CreateSchoolOutput extends School {}

@Injectable()
export class CreateSchoolUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  async execute(input: CreateSchoolInput): Promise<CreateSchoolOutput> {
    const school = await this.schoolRepository.create({
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      geofenceRadiusMeters: input.geofenceRadiusMeters || 1000,
      notificationThresholdMeters: input.notificationThresholdMeters || 500,
    });

    return school;
  }
}
