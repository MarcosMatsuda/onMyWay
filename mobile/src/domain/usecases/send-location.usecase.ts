import { ILocationRepository } from '@domain/repositories';
import { CurrentLocation } from '@domain/entities';

/**
 * SendLocationUseCase
 * Sends the parent's current location to the backend
 */
export class SendLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(schoolId: string, location: CurrentLocation): Promise<void> {
    return this.locationRepository.sendLocation(schoolId, location);
  }
}
