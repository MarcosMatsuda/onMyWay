import { CurrentLocation } from '@domain/entities';
import { ILocationRepository } from '@domain/repositories';

export class SendLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(schoolId: string, location: CurrentLocation): Promise<void> {
    return this.locationRepository.sendLocation(schoolId, location);
  }
}
