import { Parent } from '@domain/entities';

/**
 * IParentRepository interface
 * Contract for parent profile operations
 */
export interface IParentRepository {
  getProfile(): Promise<Parent>;
  saveProfile(parent: Partial<Parent>): Promise<void>;
}
