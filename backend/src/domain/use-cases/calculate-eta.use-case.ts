import { Inject } from '@nestjs/common';
import { ETA } from '../entities/eta.entity';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';

export interface CalculateETAInput {
  parentId: string;
}

export interface CalculateETAOutput {
  eta: ETA;
  distanceMeters: number;
  durationMinutes: number;
}

export interface IOSRMServiceAdapter {
  calculateRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<{
    distanceMeters: number;
    durationSeconds: number;
    polyline: string;
  }>;
}

export class CalculateETAUseCase {
  constructor(
    private readonly etaRepository: IETARepository,
    private readonly locationRepository: ILocationRepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly parentRepository: IParentRepository,
    @Inject('IOSRMServiceAdapter')
    private readonly osrmService: IOSRMServiceAdapter,
  ) {}

  async execute(input: CalculateETAInput): Promise<CalculateETAOutput> {
    // Validate parent exists
    const parent = await this.parentRepository.findById(input.parentId);
    if (!parent) {
      throw new Error(`Parent with id ${input.parentId} not found`);
    }

    // Get parent's school
    const school = await this.schoolRepository.findById(parent.schoolId);
    if (!school) {
      throw new Error(`School with id ${parent.schoolId} not found`);
    }

    // Get latest location for parent
    const latestLocation = await this.locationRepository.findLatestByParentId(
      input.parentId,
    );
    if (!latestLocation) {
      throw new Error(`No location found for parent ${input.parentId}`);
    }

    // Calculate ETA using OSRM service
    const route = await this.osrmService.calculateRoute(
      latestLocation.lat,
      latestLocation.lng,
      school.lat,
      school.lng,
    );

    // Create ETA entity
    const eta: ETA = {
      id: crypto.randomUUID(),
      parentId: input.parentId,
      schoolId: school.id,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      routePolyline: route.polyline,
      calculatedAt: new Date(),
    };

    // Save ETA
    const savedETA = await this.etaRepository.save(eta);

    return {
      eta: savedETA,
      distanceMeters: route.distanceMeters,
      durationMinutes: Math.round(route.durationSeconds / 60),
    };
  }
}
