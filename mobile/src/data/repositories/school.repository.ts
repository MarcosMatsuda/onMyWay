import { ETA, School } from '@domain/entities';
import { ArrivalsListener, ISchoolRepository } from '@domain/repositories';
import { HttpClient } from '@infrastructure/http';

interface SchoolDTO {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface ETADTO {
  parentId: string;
  distanceMeters: number;
  durationMinutes: number;
  routePolyline: string;
}

export class SchoolRepository implements ISchoolRepository {
  constructor(private httpClient: HttpClient) {}

  async getSchool(schoolId: string): Promise<School> {
    const response = await this.httpClient.get<SchoolDTO>(`/schools/${schoolId}`);
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
    const response = await this.httpClient.get<SchoolDTO[]>('/schools');
    return response.map((school: SchoolDTO) => ({
      id: school.id,
      name: school.name,
      location: {
        lat: school.location.lat,
        lng: school.location.lng,
      },
    }));
  }

  async getArrivalsQueue(schoolId: string): Promise<ETA[]> {
    const response = await this.httpClient.get<ETADTO[]>(`/schools/${schoolId}/arrivals`);
    return response.map((eta: ETADTO) => ({
      parentId: eta.parentId,
      distanceMeters: eta.distanceMeters,
      durationMinutes: eta.durationMinutes,
      routePolyline: eta.routePolyline,
    }));
  }

  watchArrivals?(schoolId: string, listener: ArrivalsListener): () => void {
    // WebSocket implementation to be added separately
    // For now, return a no-op unsubscribe function
    return () => {};
  }
}
