import { User } from '../../domain/entities/user.entity';
import { UserModel } from '../models/user.model';

export class UserMapper {
  static toDomain(model: UserModel): User {
    return {
      id: model.id,
      name: model.name,
      email: model.email,
      role: model.role,
      schoolId: model.schoolId,
      createdAt: model.createdAt,
    };
  }

  static toPersistence(
    entity: Omit<User, 'id' | 'createdAt'> & { passwordHash: string },
  ): Omit<UserModel, 'id' | 'createdAt'> {
    return {
      name: entity.name,
      email: entity.email,
      role: entity.role,
      schoolId: entity.schoolId,
      passwordHash: entity.passwordHash,
    };
  }
}
