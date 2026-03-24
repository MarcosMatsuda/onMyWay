import { School, ETA } from '@domain/entities';

/**
 * ArrivalsListener interface
 * Callback for real-time arrivals updates (WebSocket)
 */
export interface ArrivalsListener {
  onUpdate(arrivals: ETA[]): void;
  onError(error: Error): void;
}

/**
 * ISchoolRepository interface
 * Contract for school and arrivals data operations
 */
export interface ISchoolRepository {
  getSchool(schoolId: string): Promise<School>;
  listSchools(): Promise<School[]>;
  getArrivalsQueue(schoolId: string): Promise<ETA[]>;
  watchArrivals?(schoolId: string, listener: ArrivalsListener): () => void;
}
