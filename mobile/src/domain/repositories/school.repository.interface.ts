import { ETA, School } from '@domain/entities';

export interface ArrivalsListener {
  onUpdate(arrivals: ETA[]): void;
  onError(error: Error): void;
}

export interface ISchoolRepository {
  getSchool(schoolId: string): Promise<School>;
  listSchools(): Promise<School[]>;
  getArrivalsQueue(schoolId: string): Promise<ETA[]>;
  watchArrivals?(schoolId: string, listener: ArrivalsListener): () => void;
}
