import { StopSharingUseCase } from '../stop-sharing.usecase';
import { ILocationRepository } from '@domain/repositories';

describe('StopSharingUseCase', () => {
  let useCase: StopSharingUseCase;
  let mockLocationRepository: jest.Mocked<ILocationRepository>;

  beforeEach(() => {
    mockLocationRepository = {
      sendLocation: jest.fn(),
      getMyLocation: jest.fn(),
      stopSharing: jest.fn(),
    };
    useCase = new StopSharingUseCase(mockLocationRepository);
  });

  describe('execute', () => {
    it('should call stopSharing on repository', async () => {
      mockLocationRepository.stopSharing.mockResolvedValue(undefined);

      await useCase.execute();

      expect(mockLocationRepository.stopSharing).toHaveBeenCalledWith();
      expect(mockLocationRepository.stopSharing).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Network error');

      mockLocationRepository.stopSharing.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow('Network error');
    });
  });
});
