import { Injectable, Inject } from '@nestjs/common';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';

export interface UpdateSchoolConfigInput {
  schoolId: string;
  geofenceRadiusMeters?: number;
  notificationThresholdMeters?: number;
}

export interface UpdateSchoolConfigOutput {
  id: string;
  name: string;
  geofenceRadiusMeters: number;
  notificationThresholdMeters: number;
  updatedAt: Date;
}

@Injectable()
export class UpdateSchoolConfigUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(
    input: UpdateSchoolConfigInput,
  ): Promise<UpdateSchoolConfigOutput> {
    // Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Validate input values
    if (input.geofenceRadiusMeters !== undefined) {
      if (
        input.geofenceRadiusMeters < 100 ||
        input.geofenceRadiusMeters > 5000
      ) {
        throw new Error('Geofence radius must be between 100 and 5000 meters');
      }
    }

    if (input.notificationThresholdMeters !== undefined) {
      if (
        input.notificationThresholdMeters < 100 ||
        input.notificationThresholdMeters > 10000
      ) {
        throw new Error(
          'Notification threshold must be between 100 and 10000 meters',
        );
      }
    }

    // Update school config
    const updateData: Partial<UpdateSchoolConfigOutput> = {};

    if (input.geofenceRadiusMeters !== undefined) {
      updateData.geofenceRadiusMeters = input.geofenceRadiusMeters;
    }

    if (input.notificationThresholdMeters !== undefined) {
      updateData.notificationThresholdMeters =
        input.notificationThresholdMeters;
    }

    const updatedSchool = await this.schoolRepository.update(
      input.schoolId,
      updateData,
    );

    return {
      id: updatedSchool.id,
      name: updatedSchool.name,
      geofenceRadiusMeters: updatedSchool.geofenceRadiusMeters,
      notificationThresholdMeters: updatedSchool.notificationThresholdMeters,
      updatedAt: new Date(),
    };
  }
}
