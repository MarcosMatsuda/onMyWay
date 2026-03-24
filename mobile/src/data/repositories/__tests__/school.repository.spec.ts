import { SchoolRepository } from '../school.repository';
import { ETA } from '@domain/entities';

describe('SchoolRepository', () => {
  let repository: SchoolRepository;
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
    repository = new SchoolRepository(mockHttpClient as any);
  });

  describe('getSchool', () => {
    it('should fetch school by ID', async () => {
      const schoolId = 'school-123';
      const apiResponse = {
        id: schoolId,
        name: 'Example School',
        location: {
          lat: -23.5505,
          lng: -46.6333,
        },
      };

      mockHttpClient.get.mockResolvedValue(apiResponse);

      const result = await repository.getSchool(schoolId);

      expect(result).toEqual(apiResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/schools/${schoolId}`);
    });

    it('should throw error on API failure', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('School not found'));

      await expect(repository.getSchool('invalid-id')).rejects.toThrow('School not found');
    });
  });

  describe('listSchools', () => {
    it('should fetch all schools', async () => {
      const apiResponse = [
        {
          id: 'school-1',
          name: 'School 1',
          location: { lat: -23.5505, lng: -46.6333 },
        },
        {
          id: 'school-2',
          name: 'School 2',
          location: { lat: -23.551, lng: -46.634 },
        },
      ];

      mockHttpClient.get.mockResolvedValue(apiResponse);

      const result = await repository.listSchools();

      expect(result).toHaveLength(2);
      expect(result).toEqual(apiResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/schools');
    });

    it('should return empty array when no schools', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await repository.listSchools();

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('API error'));

      await expect(repository.listSchools()).rejects.toThrow('API error');
    });
  });

  describe('getArrivalsQueue', () => {
    it('should fetch arrivals queue for school', async () => {
      const schoolId = 'school-123';
      const apiResponse: ETA[] = [
        {
          parentId: 'parent-1',
          distanceMeters: 500,
          durationMinutes: 5,
          routePolyline: 'encoded_polyline_1',
        },
        {
          parentId: 'parent-2',
          distanceMeters: 1000,
          durationMinutes: 10,
          routePolyline: 'encoded_polyline_2',
        },
      ];

      mockHttpClient.get.mockResolvedValue(apiResponse);

      const result = await repository.getArrivalsQueue(schoolId);

      expect(result).toEqual(apiResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/schools/${schoolId}/arrivals`);
    });

    it('should return empty array when no arrivals', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await repository.getArrivalsQueue('school-123');

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('School not found'));

      await expect(repository.getArrivalsQueue('invalid-id')).rejects.toThrow('School not found');
    });
  });

  describe('watchArrivals', () => {
    it('should provide watchArrivals method', () => {
      expect(repository.watchArrivals).toBeDefined();
    });

    it('should return unsubscribe function', () => {
      const unsubscribe = repository.watchArrivals!('school-123', {
        onUpdate: jest.fn(),
        onError: jest.fn(),
      });

      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });
});
