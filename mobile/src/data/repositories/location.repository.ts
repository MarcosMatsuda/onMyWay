import { ILocationRepository } from '@domain/repositories';
import { CurrentLocation } from '@domain/entities';
import { HttpClient } from '@infrastructure/http';

/**
 * LocationRepository
 * Implements ILocationRepository using HTTP client
 */
export class LocationRepository implements ILocationRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async sendLocation(schoolId: string, location: CurrentLocation): Promise<void> {
    await this.httpClient.post('/locations', {
      schoolId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    });
  }

  async getMyLocation(): Promise<CurrentLocation | null> {
    try {
      const response = await this.httpClient.get<{
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
