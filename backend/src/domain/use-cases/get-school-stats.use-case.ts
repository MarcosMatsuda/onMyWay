import { Injectable, Inject } from '@nestjs/common';
import {
  IETARepository,
  ETA_REPOSITORY,
} from '../repositories/eta.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import { ETA_TTL_MINUTES } from '@infrastructure/config/eta.config';

export interface GetSchoolStatsInput {
  schoolId: string;
}

export interface GetSchoolStatsOutput {
  totalParents: number;
  avgETA: number;
  etaLessThan5Min: number;
  eta5To15Min: number;
  etaGreaterThan15Min: number;
}

@Injectable()
export class GetSchoolStatsUseCase {
  constructor(
    @Inject(ETA_REPOSITORY)
    private readonly etaRepository: IETARepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(input: GetSchoolStatsInput): Promise<GetSchoolStatsOutput> {
    // Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Get parents within geofence
    const parentIdsWithinGeofence =
      await this.schoolRepository.findParentsWithinGeofence(input.schoolId);

    // Get ETAs for these parents
    const etaMinutes: number[] = [];

    for (const parentId of parentIdsWithinGeofence) {
      const eta = await this.etaRepository.findLatestByParentId(
        parentId,
        ETA_TTL_MINUTES,
      );
      if (!eta || eta.schoolId !== input.schoolId) {
        continue;
      }
      etaMinutes.push(Math.round(eta.durationSeconds / 60));
    }

    // Calculate stats
    const totalParents = etaMinutes.length;

    if (totalParents === 0) {
      return {
        totalParents: 0,
        avgETA: 0,
        etaLessThan5Min: 0,
        eta5To15Min: 0,
        etaGreaterThan15Min: 0,
      };
    }

    const avgETA = etaMinutes.reduce((sum, eta) => sum + eta, 0) / totalParents;

    const etaLessThan5Min = etaMinutes.filter((eta) => eta < 5).length;
    const eta5To15Min = etaMinutes.filter(
      (eta) => eta >= 5 && eta <= 15,
    ).length;
    const etaGreaterThan15Min = etaMinutes.filter((eta) => eta > 15).length;

    return {
      totalParents,
      avgETA: Math.round(avgETA * 10) / 10, // Round to 1 decimal place
      etaLessThan5Min,
      eta5To15Min,
      etaGreaterThan15Min,
    };
  }
}
