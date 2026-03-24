import { CurrentLocation } from '@domain/entities';

/**
 * ILocationRepository interface
 * Contract for location data operations
 */
export interface ILocationRepository {
  sendLocation(schoolId: string, location: CurrentLocation): Promise<void>;
  getMyLocation(): Promise<CurrentLocation | null>;
}
