import { ISchoolRepository, ArrivalsListener } from '@domain/repositories';
import { School, ETA } from '@domain/entities';
import { HttpClient } from '@infrastructure/http';

/**
 * SchoolRepository
 * Implements ISchoolRepository using HTTP client
 */
export class SchoolRepository implements ISchoolRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getSchool(schoolId: string): Promise<School> {
    const response = await this.httpClient.get<{
      id: string;
      name: string;
      location: {
        lat: number;
        lng: number;
      };
    }>(`/schools/${schoolId}`);

    return {
      id: response.id,
      name: response.name,
      location: {
        lat: response.location.lat,
        lng: response.location.lng,
      },
    };
  }

  async listSchools(): Promise<School[]> {
    const responses = await this.httpClient.get<
      {
        id: string;
        name: string;
        location: {
          lat: number;
          lng: number;
        };
      }[]
    >('/schools');

    return responses.map((response) => ({
      id: response.id,
      name: response.name,
      location: {
        lat: response.location.lat,
        lng: response.location.lng,
      },
    }));
  }

  async getArrivalsQueue(schoolId: string): Promise<ETA[]> {
    const responses = await this.httpClient.get<
      {
        parentId: string;
        distanceMeters: number;
        durationMinutes: number;
        routePolyline: string;
      }[]
    >(`/schools/${schoolId}/arrivals`);

    return responses.map((response) => ({
      parentId: response.parentId,
      distanceMeters: response.distanceMeters,
      durationMinutes: response.durationMinutes,
      routePolyline: response.routePolyline,
    }));
  }

  watchArrivals?(_schoolId: string, _listener: ArrivalsListener): () => void {
    // WebSocket implementation handled separately
    return () => {};
  }
}
