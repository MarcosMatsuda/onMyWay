import { ParentRepository } from '../parent.repository';
import { Parent } from '@domain/entities';

describe('ParentRepository', () => {
  let repository: ParentRepository;
  let mockHttpClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    repository = new ParentRepository(mockHttpClient as any);
  });

  describe('getProfile', () => {
    it('should fetch parent profile from API', async () => {
      const apiResponse = {
        id: 'parent-123',
        name: 'John Doe',
        phone: '+5511987654321',
        email: 'john@example.com',
        schoolId: 'school-456',
      };

      mockHttpClient.get.mockResolvedValue(apiResponse);

      const result = await repository.getProfile();

      expect(result).toEqual(apiResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should throw error on API failure', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(repository.getProfile()).rejects.toThrow('Unauthorized');
    });

    it('should handle missing profile fields', async () => {
      const apiResponse: Parent = {
        id: 'parent-123',
        name: 'Jane Doe',
        phone: '',
        email: 'jane@example.com',
        schoolId: 'school-456',
      };

      mockHttpClient.get.mockResolvedValue(apiResponse);

      const result = await repository.getProfile();

      expect(result).toEqual(apiResponse);
    });
  });

  describe('saveProfile', () => {
    it('should update profile with partial data', async () => {
      const partialProfile: Partial<Parent> = {
        name: 'Updated Name',
        phone: '+5511999999999',
      };

      mockHttpClient.put.mockResolvedValue(undefined);

      await repository.saveProfile(partialProfile);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/auth/profile', {
        name: 'Updated Name',
        phone: '+5511999999999',
        email: undefined,
        schoolId: undefined,
      });
    });

    it('should handle save profile errors', async () => {
      mockHttpClient.put.mockRejectedValue(new Error('Update failed'));

      await expect(repository.saveProfile({ name: 'New Name' })).rejects.toThrow('Update failed');
    });

    it('should send only provided fields', async () => {
      const partialProfile: Partial<Parent> = {
        email: 'newemail@example.com',
      };

      mockHttpClient.put.mockResolvedValue(undefined);

      await repository.saveProfile(partialProfile);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/auth/profile', {
        name: undefined,
        phone: undefined,
        email: 'newemail@example.com',
        schoolId: undefined,
      });
    });
  });
});
