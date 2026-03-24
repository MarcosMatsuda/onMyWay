import { Parent } from '@domain/entities';
import { HttpClient } from '@infrastructure/http';
import { ParentRepository } from '../parent.repository';

describe('ParentRepository', () => {
  let repository: ParentRepository;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    repository = new ParentRepository(mockHttpClient);
  });

  describe('getProfile', () => {
    it('should GET profile from /auth/profile and map to entity', async () => {
      const mockResponse = {
        id: 'parent-123',
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        schoolId: 'school-123',
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await repository.getProfile();

      expect(result).toEqual({
        id: 'parent-123',
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        schoolId: 'school-123',
      });
      expect(mockHttpClient.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should propagate errors from HTTP client', async () => {
      const error = new Error('Unauthorized');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(repository.getProfile()).rejects.toThrow(error);
    });
  });

  describe('saveProfile', () => {
    it('should PUT partial profile to /auth/profile with correct payload', async () => {
      const partialParent: Partial<Parent> = {
        name: 'Jane Doe',
        phone: '9876543210',
      };
      mockHttpClient.put.mockResolvedValue(undefined);

      await repository.saveProfile(partialParent);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/auth/profile', {
        name: 'Jane Doe',
        phone: '9876543210',
        email: undefined,
        schoolId: undefined,
      });
    });

    it('should handle full parent update', async () => {
      const fullParent: Partial<Parent> = {
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com',
        schoolId: 'school-456',
      };
      mockHttpClient.put.mockResolvedValue(undefined);

      await repository.saveProfile(fullParent);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/auth/profile', fullParent);
    });

    it('should propagate errors from HTTP client', async () => {
      const error = new Error('Validation error');
      mockHttpClient.put.mockRejectedValue(error);

      await expect(repository.saveProfile({ name: 'New Name' })).rejects.toThrow(error);
    });
  });
});
