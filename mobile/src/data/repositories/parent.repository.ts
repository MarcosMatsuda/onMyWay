import { IParentRepository } from '@domain/repositories';
import { Parent } from '@domain/entities';
import { HttpClient } from '@infrastructure/http';

/**
 * ParentRepository
 * Implements IParentRepository using HTTP client
 */
export class ParentRepository implements IParentRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getProfile(): Promise<Parent> {
    const response = await this.httpClient.get<{
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
    await this.httpClient.put('/auth/profile', {
      name: parent.name,
      phone: parent.phone,
      email: parent.email,
      schoolId: parent.schoolId,
    });
  }
}
