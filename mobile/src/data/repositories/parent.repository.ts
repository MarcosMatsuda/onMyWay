import { IParentRepository } from '@domain/repositories';
import { Parent } from '@domain/entities';
import { httpClient } from '@infrastructure/http';

/**
 * ParentRepository
 * Implements IParentRepository using HTTP client
 */
export class ParentRepository implements IParentRepository {
  constructor(private readonly http = httpClient) {}

  async getProfile(): Promise<Parent> {
    const response = await this.http.get<{
      id: string;
      name: string;
      phone: string;
      email: string;
      schoolId: string;
    }>('/auth/profile');

    return {
      id: response.id,
      name: response.name,
      phone: response.phone,
      email: response.email,
      schoolId: response.schoolId,
    };
  }

  async saveProfile(parent: Partial<Parent>): Promise<void> {
    await this.http.put('/auth/profile', {
      name: parent.name,
      phone: parent.phone,
      email: parent.email,
      schoolId: parent.schoolId,
    });
  }
}

export const parentRepository = new ParentRepository();
