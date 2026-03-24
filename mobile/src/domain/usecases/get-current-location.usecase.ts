import { CurrentLocation } from '@domain/entities';
import { ILocationRepository } from '@domain/repositories';

export class GetCurrentLocationUseCase {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async execute(): Promise<CurrentLocation | null> {
    return this.locationRepository.getMyLocation();
  }
}
