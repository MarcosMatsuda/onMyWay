import { ILocationRepository } from '@domain/repositories';
import { CurrentLocation } from '@domain/entities';
import { httpClient } from '@infrastructure/http';

/**
 * LocationRepository
 * Implements ILocationRepository using HTTP client
 */
export class LocationRepository implements ILocationRepository {
  constructor(private readonly http = httpClient) {}

  async sendLocation(schoolId: string, location: CurrentLocation): Promise<void> {
    await this.http.post('/locations', {
      schoolId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    });
  }

  async getMyLocation(): Promise<CurrentLocation | null> {
    try {
      const response = await this.http.get<{
        lat: number;
        lng: number;
        accuracy: number;
        timestamp: number;
      } | null>('/locations/me');

      if (!response) {
        return null;
      }

      return {
        lat: response.lat,
        lng: response.lng,
        accuracy: response.accuracy,
        timestamp: response.timestamp,
      };
    } catch {
      return null;
    }
  }
}

export const locationRepository = new LocationRepository();
