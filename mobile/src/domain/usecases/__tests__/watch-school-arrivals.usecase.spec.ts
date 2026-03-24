import { WatchSchoolArrivalsUseCase } from '../watch-school-arrivals.usecase';
import { ISchoolRepository, ArrivalsListener } from '@domain/repositories';
import { ETA } from '@domain/entities';

describe('WatchSchoolArrivalsUseCase', () => {
  let useCase: WatchSchoolArrivalsUseCase;
  let mockSchoolRepository: jest.Mocked<ISchoolRepository>;

  beforeEach(() => {
    mockSchoolRepository = {
      getSchool: jest.fn(),
      listSchools: jest.fn(),
      getArrivalsQueue: jest.fn(),
      watchArrivals: jest.fn() as jest.MockedFunction<
        (schoolId: string, listener: ArrivalsListener) => () => void
      >,
    };
    useCase = new WatchSchoolArrivalsUseCase(mockSchoolRepository);
  });

  describe('subscribe', () => {
    it('should subscribe to arrivals updates and return unsubscribe function', () => {
      const schoolId = 'school-123';
      const mockListener: ArrivalsListener = {
        onUpdate: jest.fn(),
        onError: jest.fn(),
      };
      const mockUnsubscribe = jest.fn();

      (mockSchoolRepository.watchArrivals as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = useCase.subscribe(schoolId, mockListener);

      expect(mockSchoolRepository.watchArrivals).toHaveBeenCalledWith(schoolId, mockListener);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should return no-op function when watchArrivals is not available', () => {
      const schoolId = 'school-123';
      const mockListener: ArrivalsListener = {
        onUpdate: jest.fn(),
        onError: jest.fn(),
      };

      // Delete watchArrivals to simulate it not being available
      mockSchoolRepository.watchArrivals = undefined;

      const unsubscribe = useCase.subscribe(schoolId, mockListener);

      expect(typeof unsubscribe).toBe('function');
      // Calling unsubscribe should not throw
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should call listener.onUpdate when arrivals change', () => {
      const schoolId = 'school-123';
      const mockListener: ArrivalsListener = {
        onUpdate: jest.fn(),
        onError: jest.fn(),
      };
      const mockArrivals: ETA[] = [
        {
          parentId: 'parent-1',
          distanceMeters: 500,
          durationMinutes: 5,
          routePolyline: 'encoded_polyline_1',
        },
      ];

      (mockSchoolRepository.watchArrivals as jest.Mock).mockImplementation(
        (_schoolId: string, listener: ArrivalsListener) => {
          listener.onUpdate(mockArrivals);
          return () => {};
        },
      );

      useCase.subscribe(schoolId, mockListener);

      expect(mockListener.onUpdate).toHaveBeenCalledWith(mockArrivals);
    });

    it('should call listener.onError when error occurs', () => {
      const schoolId = 'school-123';
      const mockListener: ArrivalsListener = {
        onUpdate: jest.fn(),
        onError: jest.fn(),
      };
      const mockError = new Error('WebSocket disconnected');

      (mockSchoolRepository.watchArrivals as jest.Mock).mockImplementation(
        (_schoolId: string, listener: ArrivalsListener) => {
          listener.onError(mockError);
          return () => {};
        },
      );

      useCase.subscribe(schoolId, mockListener);

      expect(mockListener.onError).toHaveBeenCalledWith(mockError);
    });
  });
});
