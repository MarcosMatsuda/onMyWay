import { LocationRepository } from '../location.repository';
import { CurrentLocation } from '@domain/entities';

describe('LocationRepository', () => {
  let repository: LocationRepository;
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
    repository = new LocationRepository(mockHttpClient as any);
  });

  describe('sendLocation', () => {
    it('should send location with correct payload', async () => {
      const schoolId = 'school-123';
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: Date.now(),
      };

      mockHttpClient.post.mockResolvedValue(undefined);

      await repository.sendLocation(schoolId, location);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/locations', {
        schoolId,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
    });

    it('should handle send location errors', async () => {
      const schoolId = 'school-123';
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: Date.now(),
      };

      mockHttpClient.post.mockRejectedValue(new Error('Network error'));

      await expect(repository.sendLocation(schoolId, location)).rejects.toThrow('Network error');
    });
  });

  describe('getMyLocation', () => {
    it('should return current location from API', async () => {
      const apiResponse = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: 1234567890,
      };

      mockHttpClient.get.mockResolvedValue(apiResponse);

      const result = await repository.getMyLocation();

      expect(result).toEqual(apiResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/locations/me');
    });

    it('should return null when location is not available', async () => {
      mockHttpClient.get.mockResolvedValue(null);

      const result = await repository.getMyLocation();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API error'));

      const result = await repository.getMyLocation();

      expect(result).toBeNull();
    });
  });

  describe('stopSharing', () => {
    it('should call DELETE /locations/me', async () => {
      mockHttpClient.delete.mockResolvedValue(undefined);

      await repository.stopSharing();

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/locations/me');
      expect(mockHttpClient.delete).toHaveBeenCalledTimes(1);
    });

    it('should propagate HTTP errors', async () => {
      mockHttpClient.delete.mockRejectedValue(new Error('Network error'));

      await expect(repository.stopSharing()).rejects.toThrow('Network error');
    });

    it('should propagate 401 errors (JWT expired)', async () => {
      const error = new Error('Unauthorized');
      mockHttpClient.delete.mockRejectedValue(error);

      await expect(repository.stopSharing()).rejects.toThrow('Unauthorized');
    });
  });
});
