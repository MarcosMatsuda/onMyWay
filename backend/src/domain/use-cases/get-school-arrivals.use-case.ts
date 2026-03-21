import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { ILocationRepository } from '../repositories/location.repository.interface';

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
  calculatedAt: Date;
}

export interface GetSchoolArrivalsOutput {
  arrivals: ArrivalInfo[];
  schoolName: string;
  totalCount: number;
}

export class GetSchoolArrivalsUseCase {
  constructor(
    private readonly etaRepository: IETARepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly parentRepository: IParentRepository,
    private readonly locationRepository: ILocationRepository,
  ) {}

  async execute(
    input: GetSchoolArrivalsInput,
  ): Promise<GetSchoolArrivalsOutput> {
    // Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Get parents within geofence
    const parentIdsWithinGeofence =
      await this.schoolRepository.findParentsWithinGeofence(input.schoolId);

    // Get ETAs for these parents
    const arrivals: ArrivalInfo[] = [];

    for (const parentId of parentIdsWithinGeofence) {
      // Get latest ETA for this parent
      const eta = await this.etaRepository.findLatestByParentId(parentId);
      if (!eta || eta.schoolId !== input.schoolId) {
        continue; // Skip if no ETA or wrong school
      }

      // Get parent information
      const parent = await this.parentRepository.findById(parentId);
      if (!parent) {
        continue; // Skip if parent not found
      }

      // Get latest location for parent
      const location =
        await this.locationRepository.findLatestByParentId(parentId);
      if (!location) {
        continue; // Skip if no location
      }

      arrivals.push({
        parentId,
        parentName: parent.name,
        lat: location.lat,
        lng: location.lng,
        etaMinutes: Math.round(eta.durationSeconds / 60),
        distanceMeters: eta.distanceMeters,
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
