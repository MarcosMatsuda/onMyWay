import { ArrivalsListener, ISchoolRepository } from '@domain/repositories';

export class WatchSchoolArrivalsUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  subscribe(schoolId: string, listener: ArrivalsListener): () => void {
    // returns unsubscribe function — implementation injected via repository
    return this.schoolRepository.watchArrivals
      ? this.schoolRepository.watchArrivals(schoolId, listener)
      : () => {};
  }
}
