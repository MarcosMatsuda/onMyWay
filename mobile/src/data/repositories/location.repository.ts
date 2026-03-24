import { CurrentLocation } from '@domain/entities';
import { ILocationRepository } from '@domain/repositories';
import { HttpClient } from '@infrastructure/http';

interface LocationDTO {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface SendLocationRequest {
  schoolId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export class LocationRepository implements ILocationRepository {
  constructor(private httpClient: HttpClient) {}

  async sendLocation(schoolId: string, location: CurrentLocation): Promise<void> {
    await this.httpClient.post<void>('/locations', {
      schoolId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
    } as SendLocationRequest);
  }

  async getMyLocation(): Promise<CurrentLocation | null> {
    try {
      const response = await this.httpClient.get<LocationDTO>('/locations/me');
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
