import { ETA } from '@domain/entities';
import { ISchoolRepository } from '@domain/repositories';
import { GetArrivalsUseCase } from '../get-arrivals.usecase';

describe('GetArrivalsUseCase', () => {
  let useCase: GetArrivalsUseCase;
  let mockSchoolRepository: jest.Mocked<ISchoolRepository>;

  beforeEach(() => {
    mockSchoolRepository = {
      getSchool: jest.fn(),
      listSchools: jest.fn(),
      getArrivalsQueue: jest.fn(),
      watchArrivals: jest.fn(),
    };
    useCase = new GetArrivalsUseCase(mockSchoolRepository);
  });

  it('should return arrivals queue for school', async () => {
    const schoolId = 'school-123';
    const mockArrivals: ETA[] = [
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
  });

  it('should propagate repository errors', async () => {
    const schoolId = 'school-123';
    const error = new Error('Failed to fetch arrivals');
    mockSchoolRepository.getArrivalsQueue.mockRejectedValue(error);

    await expect(useCase.execute(schoolId)).rejects.toThrow(error);
  });
});
