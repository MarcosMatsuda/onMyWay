import { GetCurrentLocationUseCase } from '../get-current-location.usecase';
import { ILocationRepository } from '@domain/repositories';
import { CurrentLocation } from '@domain/entities';

describe('GetCurrentLocationUseCase', () => {
  let useCase: GetCurrentLocationUseCase;
  let mockLocationRepository: jest.Mocked<ILocationRepository>;

  beforeEach(() => {
    mockLocationRepository = {
      sendLocation: jest.fn(),
      getMyLocation: jest.fn(),
      stopSharing: jest.fn(),
    };
    useCase = new GetCurrentLocationUseCase(mockLocationRepository);
  });

  describe('execute', () => {
    it('should return current location when available', async () => {
      const mockLocation: CurrentLocation = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: Date.now(),
      };

      mockLocationRepository.getMyLocation.mockResolvedValue(mockLocation);

      const result = await useCase.execute();

      expect(result).toEqual(mockLocation);
      expect(mockLocationRepository.getMyLocation).toHaveBeenCalledTimes(1);
    });

    it('should return null when location is not available', async () => {
      mockLocationRepository.getMyLocation.mockResolvedValue(null);

      const result = await useCase.execute();

      expect(result).toBeNull();
      expect(mockLocationRepository.getMyLocation).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Location service unavailable');
      mockLocationRepository.getMyLocation.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow('Location service unavailable');
    });
  });
});
