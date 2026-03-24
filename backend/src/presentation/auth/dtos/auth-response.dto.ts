import { Parent } from '../../../domain/entities/parent.entity';

export class AuthResponseDto {
  accessToken: string;

  refreshToken: string;

  parent: Omit<Parent, 'passwordHash'>;

  constructor(accessToken: string, refreshToken: string, parent: Parent) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
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
