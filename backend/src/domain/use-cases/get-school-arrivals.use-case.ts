import { Injectable, Inject } from '@nestjs/common';
import {
  IETARepository,
  ETA_REPOSITORY,
} from '../repositories/eta.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../repositories/parent.repository.interface';
import {
  ILocationRepository,
  LOCATION_REPOSITORY,
} from '../repositories/location.repository.interface';

export interface GetSchoolArrivalsInput {
  schoolId: string;
  limit?: number;
}

export interface ArrivalInfo {
  parentId: string;
  parentName: string;
  lat: number;
  lng: number;
  etaMinutes: number;
  distanceMeters: number;
  routePolyline: string;
  calculatedAt: Date;
}

export interface GetSchoolArrivalsOutput {
  arrivals: ArrivalInfo[];
  schoolName: string;
  totalCount: number;
}

@Injectable()
export class GetSchoolArrivalsUseCase {
  constructor(
    @Inject(ETA_REPOSITORY)
    private readonly etaRepository: IETARepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(
    input: GetSchoolArrivalsInput,
  ): Promise<GetSchoolArrivalsOutput> {
    // Query 1: Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Query 2: Get parents within geofence
    const parentIdsWithinGeofence =
      await this.schoolRepository.findParentsWithinGeofence(input.schoolId);

    if (parentIdsWithinGeofence.length === 0) {
      return {
        arrivals: [],
        schoolName: school.name,
        totalCount: 0,
      };
    }

    // Query 3: Get bulk ETAs for all parents (single query instead of N)
    const etas = await this.etaRepository.findLatestBulkByParentIds(
      parentIdsWithinGeofence,
    );

    // Query 4: Get bulk locations for all parents (single query instead of N)
    const locations = await this.locationRepository.findLatestBulkByParentIds(
      parentIdsWithinGeofence,
    );

    // Query 5: Get bulk parent data for all parents (single query instead of N)
    const parents = await this.parentRepository.findByIds(
      parentIdsWithinGeofence,
    );

    // Build arrivals array from bulk query results
    const arrivals: ArrivalInfo[] = [];

    for (const parentId of parentIdsWithinGeofence) {
      const eta = etas.get(parentId);
      const location = locations.get(parentId);
      const parent = parents.get(parentId);

      // Skip if any required data is missing
      if (!eta || !location || !parent) {
        continue;
      }

      // Skip if ETA is for a different school
      if (eta.schoolId !== input.schoolId) {
        continue;
      }

      arrivals.push({
        parentId,
        parentName: parent.name,
        lat: location.lat,
        lng: location.lng,
        etaMinutes: Math.round(eta.durationSeconds / 60),
        distanceMeters: eta.distanceMeters,
        routePolyline: eta.routePolyline,
        calculatedAt: eta.calculatedAt,
      });
    }

    // Sort by ETA (ascending - soonest first)
    arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);

    // Apply limit if specified
    const limitedArrivals = input.limit
      ? arrivals.slice(0, input.limit)
      : arrivals;

    return {
      arrivals: limitedArrivals,
      schoolName: school.name,
      totalCount: arrivals.length,
    };
  }
}
