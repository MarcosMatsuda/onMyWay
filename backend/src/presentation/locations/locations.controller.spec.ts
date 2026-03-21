import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { CalculateETAUseCase } from '../../domain/use-cases/calculate-eta.use-case';
import { GetArrivalsQueueUseCase } from '../../domain/use-cases/get-arrivals-queue.use-case';
import { CreateLocationDto } from './dtos/create-location.dto';
import { LocationResponseDto } from './dtos/location-response.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { JwtPayload } from '../../infrastructure/auth/jwt-payload.interface';

describe('LocationsController', () => {
  let controller: LocationsController;
  let locationsServiceMock: any;
  let calculateETAUseCaseMock: any;
  let getArrivalsQueueUseCaseMock: any;

  const mockParentId = 'parent-123';
  const mockSchoolId = 'school-456';

  const mockLocationResponse: LocationResponseDto = {
    id: 'location-789',
    parentId: mockParentId,
    lat: -23.5505,
    lng: -46.6333,
    accuracy: 10,
    timestamp: new Date(),
    isWithinGeofence: true,
    eta: {
      id: 'eta-999',
      durationSeconds: 300,
      distanceMeters: 1500,
      routePolyline: 'polyline-string',
      calculatedAt: new Date(),
    },
  };

  const mockCalculateETAOutput = {
    eta: {
      id: 'eta-999',
      parentId: mockParentId,
      schoolId: mockSchoolId,
      distanceMeters: 1500,
      durationSeconds: 300,
      routePolyline: 'polyline-string',
      calculatedAt: new Date(),
    },
    distanceMeters: 1500,
    durationMinutes: 5,
  };

  const mockGetArrivalsQueueOutput = {
    arrivals: [
      {
        parentId: 'parent-1',
        parentName: 'John Doe',
        lat: -23.5505,
        lng: -46.6333,
        etaMinutes: 5,
        distanceMeters: 1200,
        calculatedAt: new Date(),
      },
    ],
  };

  const mockJwtPayload: JwtPayload = {
    sub: mockParentId,
    email: 'parent@example.com',
  };

  beforeEach(async () => {
    locationsServiceMock = {
      saveLocation: jest.fn(),
      getMyLatestLocation: jest.fn(),
    };

    calculateETAUseCaseMock = {
      execute: jest.fn(),
    };

    getArrivalsQueueUseCaseMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: locationsServiceMock,
        },
        {
          provide: CalculateETAUseCase,
          useValue: calculateETAUseCaseMock,
        },
        {
          provide: GetArrivalsQueueUseCase,
          useValue: getArrivalsQueueUseCaseMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  describe('saveLocation', () => {
    it('should save location and return response', async () => {
      // Arrange
      const createLocationDto: CreateLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
      };

      locationsServiceMock.saveLocation.mockResolvedValue(mockLocationResponse);

      // Act
      const result = await controller.saveLocation(
        { user: mockJwtPayload },
        createLocationDto,
      );

      // Assert
      expect(locationsServiceMock.saveLocation).toHaveBeenCalledWith(
        mockParentId,
        createLocationDto,
      );
      expect(result).toEqual(mockLocationResponse);
    });
  });

  describe('getMyLatestLocation', () => {
    it('should return latest location for authenticated parent', async () => {
      // Arrange
      locationsServiceMock.getMyLatestLocation.mockResolvedValue(
        mockLocationResponse,
      );

      // Act
      const result = await controller.getMyLatestLocation({
        user: mockJwtPayload,
      });

      // Assert
      expect(locationsServiceMock.getMyLatestLocation).toHaveBeenCalledWith(
        mockParentId,
      );
      expect(result).toEqual(mockLocationResponse);
    });

    it('should return null when no location found', async () => {
      // Arrange
      locationsServiceMock.getMyLatestLocation.mockResolvedValue(null);

      // Act
      const result = await controller.getMyLatestLocation({
        user: mockJwtPayload,
      });

      // Assert
      expect(locationsServiceMock.getMyLatestLocation).toHaveBeenCalledWith(
        mockParentId,
      );
      expect(result).toBeNull();
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA for parent', async () => {
      // Arrange
      calculateETAUseCaseMock.execute.mockResolvedValue(mockCalculateETAOutput);

      // Act
      const result = await controller.calculateETA(mockParentId);

      // Assert
      expect(calculateETAUseCaseMock.execute).toHaveBeenCalledWith({
        parentId: mockParentId,
      });
      expect(result).toEqual(mockCalculateETAOutput);
    });
  });

  describe('getArrivalsQueue', () => {
    it('should get arrivals queue for school', async () => {
      // Arrange
      const limit = 10;
      getArrivalsQueueUseCaseMock.execute.mockResolvedValue(
        mockGetArrivalsQueueOutput,
      );

      // Act
      const result = await controller.getArrivalsQueue(mockSchoolId, limit);

      // Assert
      expect(getArrivalsQueueUseCaseMock.execute).toHaveBeenCalledWith({
        schoolId: mockSchoolId,
        limit,
      });
      expect(result).toEqual(mockGetArrivalsQueueOutput);
    });

    it('should handle undefined limit', async () => {
      // Arrange
      getArrivalsQueueUseCaseMock.execute.mockResolvedValue(
        mockGetArrivalsQueueOutput,
      );

      // Act
      const result = await controller.getArrivalsQueue(mockSchoolId);

      // Assert
      expect(getArrivalsQueueUseCaseMock.execute).toHaveBeenCalledWith({
        schoolId: mockSchoolId,
        limit: undefined,
      });
      expect(result).toEqual(mockGetArrivalsQueueOutput);
    });
  });
});
