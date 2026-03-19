import { Parent } from '../../domain/entities/parent.entity';
import { ParentModel } from '../models/parent.model';

export class ParentMapper {
  static toDomain(model: ParentModel): Parent {
    return {
      id: model.id,
      name: model.name,
      email: model.email,
      phone: model.phone,
      schoolId: model.schoolId,
      createdAt: model.createdAt,
    };
  }

  static toPersistence(
    entity: Omit<Parent, 'id' | 'createdAt'> & { passwordHash: string },
  ): Omit<ParentModel, 'id' | 'createdAt'> {
    return {
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      schoolId: entity.schoolId,
      passwordHash: entity.passwordHash,
    };
  }
}
