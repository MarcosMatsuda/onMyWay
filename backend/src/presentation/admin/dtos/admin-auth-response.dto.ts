import { User } from '@domain/entities';

export class AdminAuthResponseDto {
  accessToken: string;

  refreshToken: string;

  user: Omit<User, 'passwordHash'>;

  constructor(accessToken: string, refreshToken: string, user: User) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
    };
  }
}
