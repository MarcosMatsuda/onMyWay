import { ETA } from '../../domain/entities/eta.entity';
import { ETAModel } from '../models/eta.model';

export class ETAMapper {
  static toDomain(model: ETAModel): ETA {
    return {
      id: model.id,
      parentId: model.parentId,
      schoolId: model.schoolId,
      distanceMeters: model.distanceMeters,
      durationSeconds: model.durationSeconds,
      routePolyline: model.routePolyline,
      calculatedAt: model.calculatedAt,
    };
  }

  static toPersistence(entity: ETA | Omit<ETA, 'id'>): Partial<ETAModel> {
    return {
      id: 'id' in entity ? entity.id : undefined,
      parentId: entity.parentId,
      schoolId: entity.schoolId,
      distanceMeters: entity.distanceMeters,
      durationSeconds: entity.durationSeconds,
      routePolyline: entity.routePolyline,
      calculatedAt: entity.calculatedAt,
    };
  }
}
