import { Location } from '../entities/location.entity';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';

export interface GetParentLocationsInput {
  parentId: string;
}

export interface LocationWithStatus extends Location {
  status: 'active' | 'expired';
}

export interface GetParentLocationsOutput {
  locations: LocationWithStatus[];
}

export class GetParentLocationsUseCase {
  constructor(
    private readonly locationRepository: ILocationRepository,
    private readonly parentRepository: IParentRepository,
  ) {}

  async execute(
    input: GetParentLocationsInput,
  ): Promise<GetParentLocationsOutput> {
    // Validate parent exists
    const parent = await this.parentRepository.findById(input.parentId);
    if (!parent) {
      throw new Error(`Parent with id ${input.parentId} not found`);
    }

    // Get all locations for parent
    const locations = await this.locationRepository.findByParentId(
      input.parentId,
    );

    // Determine status for each location
    // A location is considered "active" if it's less than 30 minutes old
    const locationsWithStatus: LocationWithStatus[] = locations.map(
      (location) => {
        const ageInMinutes =
          (Date.now() - new Date(location.timestamp).getTime()) / (1000 * 60);
        const status: 'active' | 'expired' =
          ageInMinutes < 30 ? 'active' : 'expired';

        return {
          ...location,
          status,
        };
      },
    );

    return {
      locations: locationsWithStatus,
    };
  }
}
