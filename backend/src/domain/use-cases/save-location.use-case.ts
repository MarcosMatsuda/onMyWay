import { Location } from '../entities/location.entity';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';

export interface SaveLocationInput {
  parentId: string;
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface SaveLocationOutput {
  location: Location;
  isWithinGeofence: boolean;
}

export class SaveLocationUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly parentRepository: IParentRepository,
  ) {}

  async execute(input: SaveLocationInput): Promise<SaveLocationOutput> {
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

    return {
      location: savedLocation,
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
