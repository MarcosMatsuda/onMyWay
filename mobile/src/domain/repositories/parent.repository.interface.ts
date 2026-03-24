import { Parent } from '@domain/entities';

export interface IParentRepository {
  getProfile(): Promise<Parent>;
  saveProfile(parent: Partial<Parent>): Promise<void>;
}
