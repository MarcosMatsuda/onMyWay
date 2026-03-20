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
    entity: Omit<Location, 'id'>,
  ): Omit<LocationModel, 'id'> {
    return {
      parentId: entity.parentId,
      lat: entity.lat,
      lng: entity.lng,
      point: `POINT(${entity.lng} ${entity.lat})`,
      accuracy: entity.accuracy,
      timestamp: entity.timestamp,
    };
  }
}
