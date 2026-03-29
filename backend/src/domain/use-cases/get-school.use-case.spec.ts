import { NotFoundException } from '@nestjs/common';
import { GetSchoolUseCase } from './get-school.use-case';

const mockSchool = {
  id: 'school-123',
  name: 'Test School',
  location: { lat: -23.5505, lng: -46.6333 },
  geofenceRadiusMeters: 500,
  notificationThresholdMeters: 1000,
};

describe('GetSchoolUseCase', () => {
  let useCase: GetSchoolUseCase;
  let mockSchoolRepository: any;

  beforeEach(() => {
    mockSchoolRepository = {
      findById: jest.fn(),
    };

    useCase = new GetSchoolUseCase(mockSchoolRepository);
  });

  it('returns school when found', async () => {
    mockSchoolRepository.findById.mockResolvedValue(mockSchool);

    const result = await useCase.execute('school-123');

    expect(result).toEqual(mockSchool);
    expect(mockSchoolRepository.findById).toHaveBeenCalledWith('school-123');
  });

  it('throws NotFoundException when school not found', async () => {
    mockSchoolRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockSchoolRepository.findById).toHaveBeenCalledWith('nonexistent');
  });

  it('throws NotFoundException with correct message', async () => {
    mockSchoolRepository.findById.mockResolvedValue(null);

    try {
      await useCase.execute('school-999');
      fail('Should have thrown NotFoundException');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toContain('School with ID school-999 not found');
    }
  });
});
