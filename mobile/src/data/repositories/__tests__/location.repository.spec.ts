import { CurrentLocation } from '@domain/entities';
import { HttpClient } from '@infrastructure/http';
import { LocationRepository } from '../location.repository';

describe('LocationRepository', () => {
  let repository: LocationRepository;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    repository = new LocationRepository(mockHttpClient);
  });

  describe('sendLocation', () => {
    it('should POST location to /locations with correct payload', async () => {
      const schoolId = 'school-123';
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: 1234567890,
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

    it('should propagate errors from HTTP client', async () => {
      const schoolId = 'school-123';
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: 1234567890,
      };
      const error = new Error('Network error');
      mockHttpClient.post.mockRejectedValue(error);

      await expect(repository.sendLocation(schoolId, location)).rejects.toThrow(error);
    });
  });

  describe('getMyLocation', () => {
    it('should GET location from /locations/me and map to entity', async () => {
      const mockResponse = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: 1234567890,
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await repository.getMyLocation();

      expect(result).toEqual({
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: 1234567890,
      });
      expect(mockHttpClient.get).toHaveBeenCalledWith('/locations/me');
    });

    it('should return null on error', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Not found'));

      const result = await repository.getMyLocation();

      expect(result).toBeNull();
    });
  });
});
