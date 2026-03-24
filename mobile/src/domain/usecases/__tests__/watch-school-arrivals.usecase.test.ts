import { ETA } from '@domain/entities';
import { ArrivalsListener, ISchoolRepository } from '@domain/repositories';
import { WatchSchoolArrivalsUseCase } from '../watch-school-arrivals.usecase';

describe('WatchSchoolArrivalsUseCase', () => {
  let useCase: WatchSchoolArrivalsUseCase;
  let mockSchoolRepository: jest.Mocked<ISchoolRepository>;

  beforeEach(() => {
    mockSchoolRepository = {
      getSchool: jest.fn(),
      listSchools: jest.fn(),
      getArrivalsQueue: jest.fn(),
      watchArrivals: jest.fn(),
    };
    useCase = new WatchSchoolArrivalsUseCase(mockSchoolRepository);
  });

  it('should subscribe to arrivals and return unsubscribe function', () => {
    const schoolId = 'school-123';
    const mockListener: ArrivalsListener = {
      onUpdate: jest.fn(),
      onError: jest.fn(),
    };
    const unsubscribe = jest.fn();
    mockSchoolRepository.watchArrivals = jest.fn().mockReturnValue(unsubscribe);

    const result = useCase.subscribe(schoolId, mockListener);

    expect(mockSchoolRepository.watchArrivals).toHaveBeenCalledWith(schoolId, mockListener);
    expect(result).toBe(unsubscribe);
  });

  it('should call listener onUpdate with new arrivals', () => {
    const schoolId = 'school-123';
    const mockListener: ArrivalsListener = {
      onUpdate: jest.fn(),
      onError: jest.fn(),
    };
    const mockArrivals: ETA[] = [
      {
        parentId: 'parent-1',
        distanceMeters: 5000,
        durationMinutes: 10,
        routePolyline: 'encoded_polyline_1',
      },
    ];

    let capturedListener: ArrivalsListener | undefined;
    mockSchoolRepository.watchArrivals = jest.fn().mockImplementation((schoolId, listener) => {
      capturedListener = listener;
      return () => {};
    });

    useCase.subscribe(schoolId, mockListener);

    // Simulate arrival update
    capturedListener?.onUpdate(mockArrivals);

    expect(mockListener.onUpdate).toHaveBeenCalledWith(mockArrivals);
  });

  it('should call listener onError when error occurs', () => {
    const schoolId = 'school-123';
    const mockListener: ArrivalsListener = {
      onUpdate: jest.fn(),
      onError: jest.fn(),
    };
    const error = new Error('Subscription error');

    let capturedListener: ArrivalsListener | undefined;
    mockSchoolRepository.watchArrivals = jest.fn().mockImplementation((schoolId, listener) => {
      capturedListener = listener;
      return () => {};
    });

    useCase.subscribe(schoolId, mockListener);

    // Simulate error
    capturedListener?.onError(error);

    expect(mockListener.onError).toHaveBeenCalledWith(error);
  });

  it('should return no-op unsubscribe when watchArrivals not implemented', () => {
    const schoolId = 'school-123';
    const mockListener: ArrivalsListener = {
      onUpdate: jest.fn(),
      onError: jest.fn(),
    };
    // Don't implement watchArrivals
    delete mockSchoolRepository.watchArrivals;

    const result = useCase.subscribe(schoolId, mockListener);

    expect(typeof result).toBe('function');
    result(); // should not throw
  });
});
