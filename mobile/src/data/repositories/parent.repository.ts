import { Parent } from '@domain/entities';
import { IParentRepository } from '@domain/repositories';
import { HttpClient } from '@infrastructure/http';

interface ParentDTO {
  id: string;
  name: string;
  phone: string;
  email: string;
  schoolId: string;
}

export class ParentRepository implements IParentRepository {
  constructor(private httpClient: HttpClient) {}

  async getProfile(): Promise<Parent> {
    const response = await this.httpClient.get<ParentDTO>('/auth/profile');
    return {
      id: response.id,
      name: response.name,
      phone: response.phone,
      email: response.email,
      schoolId: response.schoolId,
    };
  }

  async saveProfile(parent: Partial<Parent>): Promise<void> {
    await this.httpClient.put<void>('/auth/profile', {
      name: parent.name,
      phone: parent.phone,
      email: parent.email,
      schoolId: parent.schoolId,
    });
  }
}
