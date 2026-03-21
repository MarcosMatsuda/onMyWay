import { Location } from '../entities/location.entity';
import { ETA } from '../entities/eta.entity';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { IETARepository } from '../repositories/eta.repository.interface';

export interface SaveLocationWithETAInput {
  parentId: string;
  lat: number;
  lng: number;
  schoolId: string;
  accuracy?: number;
}

export interface SaveLocationWithETAOutput {
  location: Location;
  eta: ETA;
  distanceMeters: number;
  durationMinutes: number;
  isWithinGeofence: boolean;
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

export class SaveLocationWithETAUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly parentRepository: IParentRepository,
    private readonly etaRepository: IETARepository,
    private readonly osrmService: IOSRMServiceAdapter,
  ) {}

  async execute(
    input: SaveLocationWithETAInput,
  ): Promise<SaveLocationWithETAOutput> {
    // Validate parent exists
    const parent = await this.parentRepository.findById(input.parentId);
    if (!parent) {
      throw new Error(`Parent with id ${input.parentId} not found`);
    }

    // Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Validate parent belongs to this school
    if (parent.schoolId !== input.schoolId) {
      throw new Error(
        `Parent ${input.parentId} does not belong to school ${input.schoolId}`,
      );
    }

    // Calculate distance to school (simplified Haversine formula)
    const distanceMeters = this.calculateDistance(
      input.lat,
      input.lng,
      school.lat,
      school.lng,
    );

    // Check if within geofence
    const isWithinGeofence = distanceMeters <= school.geofenceRadiusMeters;

    // Create location entity
    const location: Location = {
      id: crypto.randomUUID(),
      parentId: input.parentId,
      lat: input.lat,
      lng: input.lng,
      accuracy: input.accuracy || 0,
      timestamp: new Date(),
    };

    // Save location
    const savedLocation = await this.locationRepository.save(location);

    // Calculate ETA using OSRM service
    const route = await this.osrmService.calculateRoute(
      input.lat,
      input.lng,
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
      location: savedLocation,
      eta: savedETA,
      distanceMeters: route.distanceMeters,
      durationMinutes: Math.round(route.durationSeconds / 60),
      isWithinGeofence,
    };
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    // Simplified distance calculation for MVP
    // In production, use proper Haversine formula or PostGIS
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
