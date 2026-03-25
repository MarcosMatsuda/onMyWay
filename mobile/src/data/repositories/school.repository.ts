import { ISchoolRepository, ArrivalsListener } from '@domain/repositories';
import { School, ETA } from '@domain/entities';
import { httpClient } from '@infrastructure/http';

/**
 * SchoolRepository
 * Implements ISchoolRepository using HTTP client
 */
export class SchoolRepository implements ISchoolRepository {
  constructor(private readonly http = httpClient) {}

  async getSchool(schoolId: string): Promise<School> {
    const response = await this.http.get<{
      id: string;
      name: string;
      lat: number;
      lng: number;
    }>(`/schools/${schoolId}`);

    return {
      id: response.id,
      name: response.name,
      location: {
        lat: Number(response.lat),
        lng: Number(response.lng),
      },
    };
  }

  async listSchools(): Promise<School[]> {
    interface SchoolResponse {
      id: string;
      name: string;
      lat: string | number;
      lng: string | number;
    }

    const responses = await this.http.get<SchoolResponse[]>('/schools');

    return responses.map((response) => ({
      id: response.id,
      name: response.name,
      location: {
        lat: Number(response.lat),
        lng: Number(response.lng),
      },
    }));
  }

  async getArrivalsQueue(schoolId: string): Promise<ETA[]> {
    interface ETAResponse {
      parentId: string;
      distanceMeters: number;
      durationMinutes: number;
      routePolyline: string;
    }

    const responses = await this.http.get<ETAResponse[]>(`/schools/${schoolId}/arrivals`);

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

export const schoolRepository = new SchoolRepository();
