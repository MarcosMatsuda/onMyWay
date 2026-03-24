import { ISchoolRepository, ArrivalsListener } from '@domain/repositories';

/**
 * WatchSchoolArrivalsUseCase
 * Subscribes to real-time arrivals updates for a school (WebSocket)
 * Returns an unsubscribe function to stop listening
 */
export class WatchSchoolArrivalsUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  subscribe(schoolId: string, listener: ArrivalsListener): () => void {
    // Returns unsubscribe function
    // Implementation injected via repository
    return this.schoolRepository.watchArrivals
      ? this.schoolRepository.watchArrivals(schoolId, listener)
      : () => {};
  }
}
