import { NotifySchoolUseCase } from './notify-school.use-case';
import { GetSchoolArrivalsUseCase } from './get-school-arrivals.use-case';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { ArrivalsGateway } from '../../infrastructure/websocket/arrivals.gateway';
import { School } from '../entities/school.entity';
import { ETA } from '../entities/eta.entity';

describe('NotifySchoolUseCase', () => {
  let useCase: NotifySchoolUseCase;
  let getSchoolArrivalsUseCaseMock: jest.Mocked<GetSchoolArrivalsUseCase>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let arrivalsGatewayMock: jest.Mocked<ArrivalsGateway>;

  const mockSchool: School = {
    id: 'school-456',
    name: 'Springfield Elementary',
    lat: -23.55052,
    lng: -46.633308,
    geofenceRadiusMeters: 500,
    notificationThresholdMeters: 1000,
    createdAt: new Date(),
  };

  const mockETA: ETA = {
    id: 'eta-1',
    parentId: 'parent-1',
    schoolId: 'school-456',
    durationSeconds: 900,
    distanceMeters: 1200,
    routePolyline: 'encoded_polyline_1',
    calculatedAt: new Date(),
  };

  const mockArrivals = [
    {
      parentId: 'parent-1',
      parentName: 'John Doe',
      lat: -23.551,
      lng: -46.634,
      etaMinutes: 15,
      distanceMeters: 1200,
      routePolyline: 'encoded_polyline_1',
      calculatedAt: new Date(),
    },
  ];

  const mockArrivalsOutput = {
    schoolName: 'Springfield Elementary',
    totalCount: 1,
    arrivals: mockArrivals,
  };

  beforeEach(() => {
    getSchoolArrivalsUseCaseMock = {
      execute: jest.fn(),
    } as any;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    } as any;

    arrivalsGatewayMock = {
      emitArrivalsUpdated: jest.fn(),
    } as any;

    useCase = new NotifySchoolUseCase(
      getSchoolArrivalsUseCaseMock,
      schoolRepositoryMock,
      arrivalsGatewayMock,
    );
  });

  describe('execute', () => {
    it('should notify school with updated arrivals queue', async () => {
      // Arrange
      const input = {
        schoolId: 'school-456',
        parentId: 'parent-1',
        eta: mockETA,
      };

      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      getSchoolArrivalsUseCaseMock.execute.mockResolvedValue(
        mockArrivalsOutput,
      );

      // Act
      await useCase.execute(input);

      // Assert
      expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
      expect(getSchoolArrivalsUseCaseMock.execute).toHaveBeenCalledWith({
        schoolId: 'school-456',
      });
      expect(arrivalsGatewayMock.emitArrivalsUpdated).toHaveBeenCalledWith(
        'school-456',
        mockArrivals,
        'Springfield Elementary',
      );
    });

    it('should throw error if school not found', async () => {
      // Arrange
      const input = {
        schoolId: 'non-existent-school',
        parentId: 'parent-1',
        eta: mockETA,
      };

      schoolRepositoryMock.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'School with id non-existent-school not found',
      );
      expect(getSchoolArrivalsUseCaseMock.execute).not.toHaveBeenCalled();
      expect(arrivalsGatewayMock.emitArrivalsUpdated).not.toHaveBeenCalled();
    });

    it('should emit event with empty arrivals when no parents in queue', async () => {
      // Arrange
      const input = {
        schoolId: 'school-456',
        parentId: 'parent-1',
        eta: mockETA,
      };

      const emptyArrivalsOutput = {
        schoolName: 'Springfield Elementary',
        totalCount: 0,
        arrivals: [],
      };

      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      getSchoolArrivalsUseCaseMock.execute.mockResolvedValue(
        emptyArrivalsOutput,
      );

      // Act
      await useCase.execute(input);

      // Assert
      expect(arrivalsGatewayMock.emitArrivalsUpdated).toHaveBeenCalledWith(
        'school-456',
        [],
        'Springfield Elementary',
      );
    });

    it('should propagate error from GetSchoolArrivalsUseCase', async () => {
      // Arrange
      const input = {
        schoolId: 'school-456',
        parentId: 'parent-1',
        eta: mockETA,
      };

      const error = new Error('Failed to get arrivals');

      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      getSchoolArrivalsUseCaseMock.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Failed to get arrivals',
      );
      expect(arrivalsGatewayMock.emitArrivalsUpdated).not.toHaveBeenCalled();
    });

    it('should call gateway with correct school name', async () => {
      // Arrange
      const input = {
        schoolId: 'school-456',
        parentId: 'parent-1',
        eta: mockETA,
      };

      const customSchool: School = {
        ...mockSchool,
        name: 'Custom School Name',
      };

      schoolRepositoryMock.findById.mockResolvedValue(customSchool);
      getSchoolArrivalsUseCaseMock.execute.mockResolvedValue(
        mockArrivalsOutput,
      );

      // Act
      await useCase.execute(input);

      // Assert
      expect(arrivalsGatewayMock.emitArrivalsUpdated).toHaveBeenCalledWith(
        'school-456',
        mockArrivals,
        'Custom School Name',
      );
    });

    it('should handle multiple arrivals in queue', async () => {
      // Arrange
      const input = {
        schoolId: 'school-456',
        parentId: 'parent-1',
        eta: mockETA,
      };

      const multipleArrivals = [
        {
          parentId: 'parent-1',
          parentName: 'John Doe',
          lat: -23.551,
          lng: -46.634,
          etaMinutes: 10,
          distanceMeters: 1200,
          routePolyline: 'encoded_polyline_1',
          calculatedAt: new Date(),
        },
        {
          parentId: 'parent-2',
          parentName: 'Jane Smith',
          lat: -23.552,
          lng: -46.635,
          etaMinutes: 15,
          distanceMeters: 1500,
          routePolyline: 'encoded_polyline_2',
          calculatedAt: new Date(),
        },
        {
          parentId: 'parent-3',
          parentName: 'Bob Johnson',
          lat: -23.553,
          lng: -46.636,
          etaMinutes: 20,
          distanceMeters: 1800,
          routePolyline: 'encoded_polyline_3',
          calculatedAt: new Date(),
        },
      ];

      const multipleArrivalsOutput = {
        schoolName: 'Springfield Elementary',
        totalCount: 3,
        arrivals: multipleArrivals,
      };

      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      getSchoolArrivalsUseCaseMock.execute.mockResolvedValue(
        multipleArrivalsOutput,
      );

      // Act
      await useCase.execute(input);

      // Assert
      expect(arrivalsGatewayMock.emitArrivalsUpdated).toHaveBeenCalledWith(
        'school-456',
        multipleArrivals,
        'Springfield Elementary',
      );
      expect(
        (arrivalsGatewayMock.emitArrivalsUpdated.mock.calls[0] as any)[1],
      ).toHaveLength(3);
    });
  });
});
