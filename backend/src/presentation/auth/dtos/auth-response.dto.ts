import { Parent } from '../../../domain/entities/parent.entity';

export class AuthResponseDto {
  token: string;
  parent: Omit<Parent, 'passwordHash'>;

  constructor(token: string, parent: Parent) {
    this.token = token;
    this.parent = {
      id: parent.id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      schoolId: parent.schoolId,
      createdAt: parent.createdAt,
    };
  }
}
