import { GetArrivalsUseCase } from '../get-arrivals.usecase';
import { ISchoolRepository } from '@domain/repositories';
import { ETA } from '@domain/entities';

describe('GetArrivalsUseCase', () => {
  let useCase: GetArrivalsUseCase;
  let mockSchoolRepository: jest.Mocked<ISchoolRepository>;

  beforeEach(() => {
    mockSchoolRepository = {
      getSchool: jest.fn(),
      listSchools: jest.fn(),
      getArrivalsQueue: jest.fn(),
    };
    useCase = new GetArrivalsUseCase(mockSchoolRepository);
  });

  describe('execute', () => {
    it('should return arrivals queue for school', async () => {
      const schoolId = 'school-123';
      const mockArrivals: ETA[] = [
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

      mockSchoolRepository.getArrivalsQueue.mockResolvedValue(mockArrivals);

      const result = await useCase.execute(schoolId);

      expect(result).toEqual(mockArrivals);
      expect(mockSchoolRepository.getArrivalsQueue).toHaveBeenCalledWith(schoolId);
      expect(mockSchoolRepository.getArrivalsQueue).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no arrivals', async () => {
      const schoolId = 'school-123';
      mockSchoolRepository.getArrivalsQueue.mockResolvedValue([]);

      const result = await useCase.execute(schoolId);

      expect(result).toEqual([]);
      expect(mockSchoolRepository.getArrivalsQueue).toHaveBeenCalledWith(schoolId);
    });

    it('should propagate repository errors', async () => {
      const schoolId = 'school-123';
      const error = new Error('School not found');

      mockSchoolRepository.getArrivalsQueue.mockRejectedValue(error);

      await expect(useCase.execute(schoolId)).rejects.toThrow('School not found');
    });
  });
});
