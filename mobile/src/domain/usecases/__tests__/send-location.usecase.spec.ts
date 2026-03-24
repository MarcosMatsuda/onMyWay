import { SendLocationUseCase } from '../send-location.usecase';
import { ILocationRepository } from '@domain/repositories';
import { CurrentLocation } from '@domain/entities';

describe('SendLocationUseCase', () => {
  let useCase: SendLocationUseCase;
  let mockLocationRepository: jest.Mocked<ILocationRepository>;

  beforeEach(() => {
    mockLocationRepository = {
      sendLocation: jest.fn(),
      getMyLocation: jest.fn(),
    };
    useCase = new SendLocationUseCase(mockLocationRepository);
  });

  describe('execute', () => {
    it('should send location to repository', async () => {
      const schoolId = 'school-123';
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: Date.now(),
      };

      mockLocationRepository.sendLocation.mockResolvedValue(undefined);

      await useCase.execute(schoolId, location);

      expect(mockLocationRepository.sendLocation).toHaveBeenCalledWith(schoolId, location);
      expect(mockLocationRepository.sendLocation).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async () => {
      const schoolId = 'school-123';
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: Date.now(),
      };
      const error = new Error('Network error');

      mockLocationRepository.sendLocation.mockRejectedValue(error);

      await expect(useCase.execute(schoolId, location)).rejects.toThrow('Network error');
    });

    it('should handle empty schoolId gracefully', async () => {
      const location: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: Date.now(),
      };

      mockLocationRepository.sendLocation.mockResolvedValue(undefined);

      await useCase.execute('', location);

      expect(mockLocationRepository.sendLocation).toHaveBeenCalledWith('', location);
    });
  });
});
