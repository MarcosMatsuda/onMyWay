import { CurrentLocation } from '@domain/entities';

export interface ILocationRepository {
  sendLocation(schoolId: string, location: CurrentLocation): Promise<void>;
  getMyLocation(): Promise<CurrentLocation | null>;
}
