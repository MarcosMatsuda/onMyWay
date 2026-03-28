import { ILocationRepository } from '@domain/repositories';

/**
 * StopSharingUseCase
 * Stops sharing the parent's location with the backend
 */
export class StopSharingUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(): Promise<void> {
    return this.locationRepository.stopSharing();
  }
}
