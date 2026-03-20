import { Location } from '../../domain/entities/location.entity';
import { LocationModel } from '../models/location.model';

export class LocationMapper {
  static toDomain(model: LocationModel): Location {
    return {
      id: model.id,
      parentId: model.parentId,
      lat: model.lat,
      lng: model.lng,
      accuracy: model.accuracy,
      timestamp: model.timestamp,
    };
  }

  static toPersistence(
    entity: Location | Omit<Location, 'id'>,
  ): Partial<LocationModel> {
    return {
      id: 'id' in entity ? entity.id : undefined,
      parentId: entity.parentId,
      lat: entity.lat,
      lng: entity.lng,
      accuracy: entity.accuracy,
      timestamp: entity.timestamp,
    };
  }
}
