import { ArrivalsListener, ISchoolRepository } from '@domain/repositories';
import { HttpClient } from '@infrastructure/http';
import { SchoolRepository } from '../school.repository';

describe('SchoolRepository', () => {
  let repository: SchoolRepository;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    repository = new SchoolRepository(mockHttpClient);
  });

  describe('getSchool', () => {
    it('should GET school from /schools/:id and map to entity', async () => {
      const schoolId = 'school-123';
      const mockResponse = {
        id: 'school-123',
        name: 'São Paulo High School',
        location: {
          lat: -23.5505,
          lng: -46.6333,
        },
      };
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await repository.getSchool(schoolId);

      expect(result).toEqual({
        id: 'school-123',
        name: 'São Paulo High School',
        location: {
          lat: -23.5505,
          lng: -46.6333,
        },
      });
      expect(mockHttpClient.get).toHaveBeenCalledWith('/schools/school-123');
    });

    it('should propagate errors from HTTP client', async () => {
      const error = new Error('School not found');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(repository.getSchool('school-123')).rejects.toThrow(error);
    });
  });

  describe('listSchools', () => {
    it('should GET schools from /schools and map array to entities', async () => {
      const mockResponse = [
        {
          id: 'school-1',
          name: 'School 1',
          location: { lat: -23.5505, lng: -46.6333 },
        },
        {
          id: 'school-2',
          name: 'School 2',
          location: { lat: -23.4605, lng: -46.7533 },
        },
      ];
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await repository.listSchools();

      expect(result).toEqual([
        {
          id: 'school-1',
          name: 'School 1',
          location: { lat: -23.5505, lng: -46.6333 },
        },
        {
          id: 'school-2',
          name: 'School 2',
          location: { lat: -23.4605, lng: -46.7533 },
        },
      ]);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/schools');
    });

    it('should return empty array when no schools', async () => {
      mockHttpClient.get.mockResolvedValue([]);

      const result = await repository.listSchools();

      expect(result).toEqual([]);
    });

    it('should propagate errors from HTTP client', async () => {
      const error = new Error('Network error');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(repository.listSchools()).rejects.toThrow(error);
    });
  });

  describe('getArrivalsQueue', () => {
    it('should GET arrivals from /schools/:id/arrivals and map array to entities', async () => {
      const schoolId = 'school-123';
      const mockResponse: any[] = [
        {
          parentId: 'parent-1',
          distanceMeters: 5000,
          durationMinutes: 10,
          routePolyline: 'encoded_polyline_1',
        },
        {
          parentId: 'parent-2',
          distanceMeters: 3000,
          durationMinutes: 5,
          routePolyline: 'encoded_polyline_2',
        },
      ];
      mockHttpClient.get.mockResolvedValue(mockResponse);

      const result = await repository.getArrivalsQueue(schoolId);

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/schools/school-123/arrivals');
    });

    it('should return empty array when no arrivals', async () => {
      const schoolId = 'school-123';
      mockHttpClient.get.mockResolvedValue([]);

      const result = await repository.getArrivalsQueue(schoolId);

      expect(result).toEqual([]);
    });

    it('should propagate errors from HTTP client', async () => {
      const error = new Error('Not found');
      mockHttpClient.get.mockRejectedValue(error);

      await expect(repository.getArrivalsQueue('school-123')).rejects.toThrow(error);
    });
  });

  describe('watchArrivals', () => {
    it('should return a no-op unsubscribe function', () => {
      const mockListener: ArrivalsListener = {
        onUpdate: jest.fn(),
        onError: jest.fn(),
      };

      const unsubscribe = repository.watchArrivals?.('school-123', mockListener);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe?.(); // should not throw
    });
  });

  describe('interface compliance', () => {
    it('should implement ISchoolRepository interface', () => {
      const instance: ISchoolRepository = repository;

      expect(instance).toBeDefined();
      expect(typeof instance.getSchool).toBe('function');
      expect(typeof instance.listSchools).toBe('function');
      expect(typeof instance.getArrivalsQueue).toBe('function');
      expect(typeof instance.watchArrivals).toBe('function');
    });
  });
});
