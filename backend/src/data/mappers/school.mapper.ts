import { School } from '../../domain/entities/school.entity';
import { SchoolModel } from '../models/school.model';

export class SchoolMapper {
  static toDomain(model: SchoolModel): School {
    return {
      id: model.id,
      name: model.name,
      lat: model.lat,
      lng: model.lng,
      geofenceRadiusMeters: model.geofenceRadiusMeters,
      notificationThresholdMeters: model.notificationThresholdMeters,
      inviteCode: model.inviteCode,
      createdAt: model.createdAt,
    };
  }

  static toPersistence(
    entity: Omit<School, 'id' | 'createdAt'>,
  ): Omit<SchoolModel, 'id' | 'createdAt'> {
    return {
      name: entity.name,
      lat: entity.lat,
      lng: entity.lng,
      location: `POINT(${entity.lng} ${entity.lat})`,
      geofenceRadiusMeters: entity.geofenceRadiusMeters,
      notificationThresholdMeters: entity.notificationThresholdMeters,
      inviteCode: entity.inviteCode,
    };
  }
}
