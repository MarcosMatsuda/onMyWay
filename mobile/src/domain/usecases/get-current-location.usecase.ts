import { ILocationRepository } from '@domain/repositories';
import { CurrentLocation } from '@domain/entities';

/**
 * GetCurrentLocationUseCase
 * Retrieves the parent's current location from storage/device
 */
export class GetCurrentLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(): Promise<CurrentLocation | null> {
    return this.locationRepository.getMyLocation();
  }
}
