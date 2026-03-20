import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { SaveLocationWithETAUseCase } from '../../domain/use-cases/save-location-with-eta.use-case';
import { GetParentLocationsUseCase } from '../../domain/use-cases/get-parent-locations.use-case';
import { CalculateETAUseCase } from '../../domain/use-cases/calculate-eta.use-case';
import { GetArrivalsQueueUseCase } from '../../domain/use-cases/get-arrivals-queue.use-case';
import { SaveLocationDto } from './dtos/save-location.dto';
import { SaveLocationWithETAOutput } from '../../domain/use-cases/save-location-with-eta.use-case';
import {
  GetParentLocationsOutput,
  LocationWithStatus,
} from '../../domain/use-cases/get-parent-locations.use-case';

describe('LocationsController', () => {
  let controller: LocationsController;
  let saveLocationWithETAUseCaseMock: any;
  let getParentLocationsUseCaseMock: any;
  let calculateETAUseCaseMock: any;
  let getArrivalsQueueUseCaseMock: any;

  const mockParentId = 'parent-123';
  const mockSchoolId = 'school-456';

  const mockLocation = {
    id: 'location-789',
    parentId: mockParentId,
    lat: -23.5505,
    lng: -46.6333,
    accuracy: 10,
    timestamp: new Date(),
  };

  const mockETA = {
    id: 'eta-999',
    parentId: mockParentId,
    schoolId: mockSchoolId,
    distanceMeters: 1500,
    durationSeconds: 300,
    routePolyline: 'polyline-string',
    calculatedAt: new Date(),
  };

  const mockSaveLocationWithETAOutput: SaveLocationWithETAOutput = {
    location: mockLocation,
    eta: mockETA,
    distanceMeters: 1500,
    durationMinutes: 5,
    isWithinGeofence: true,
  };

  beforeEach(async () => {
    saveLocationWithETAUseCaseMock = {
      execute: jest.fn(),
    };

    getParentLocationsUseCaseMock = {
      execute: jest.fn(),
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
          provide: SaveLocationWithETAUseCase,
          useValue: saveLocationWithETAUseCaseMock,
        },
        {
          provide: GetParentLocationsUseCase,
          useValue: getParentLocationsUseCaseMock,
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
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  describe('saveLocation (POST /locations)', () => {
    it('should save location and return location + ETA', async () => {
      const saveLocationDto: SaveLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        schoolId: mockSchoolId,
        accuracy: 10,
      };

      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      jest
        .spyOn(saveLocationWithETAUseCaseMock, 'execute')
        .mockResolvedValue(mockSaveLocationWithETAOutput);

      const result = await controller.saveLocation(
        mockRequest,
        saveLocationDto,
      );

      expect(result).toEqual(mockSaveLocationWithETAOutput);
      expect(saveLocationWithETAUseCaseMock.execute).toHaveBeenCalledWith({
        parentId: mockParentId,
        lat: saveLocationDto.lat,
        lng: saveLocationDto.lng,
        schoolId: saveLocationDto.schoolId,
        accuracy: saveLocationDto.accuracy,
      });
    });

    it('should extract parentId from JWT request.user.sub', async () => {
      const saveLocationDto: SaveLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        schoolId: mockSchoolId,
      };

      const mockRequest = {
        user: {
          sub: 'jwt-parent-id',
        },
      };

      jest
        .spyOn(saveLocationWithETAUseCaseMock, 'execute')
        .mockResolvedValue(mockSaveLocationWithETAOutput);

      await controller.saveLocation(mockRequest, saveLocationDto);

      expect(saveLocationWithETAUseCaseMock.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 'jwt-parent-id',
        }),
      );
    });

    it('should use default accuracy (0) when not provided', async () => {
      const saveLocationDto: SaveLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        schoolId: mockSchoolId,
        // accuracy not provided
      };

      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      jest
        .spyOn(saveLocationWithETAUseCaseMock, 'execute')
        .mockResolvedValue(mockSaveLocationWithETAOutput);

      await controller.saveLocation(mockRequest, saveLocationDto);

      expect(saveLocationWithETAUseCaseMock.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: undefined,
        }),
      );
    });

    it('should handle SaveLocationWithETAUseCase error', async () => {
      const saveLocationDto: SaveLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        schoolId: mockSchoolId,
      };

      const mockRequest = {
        user: {
          sub: 'non-existent-parent',
        },
      };

      jest
        .spyOn(saveLocationWithETAUseCaseMock, 'execute')
        .mockRejectedValue(
          new Error('Parent with id non-existent-parent not found'),
        );

      await expect(
        controller.saveLocation(mockRequest, saveLocationDto),
      ).rejects.toThrow('Parent with id non-existent-parent not found');
    });

    it('should return location with geofence check results', async () => {
      const saveLocationDto: SaveLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        schoolId: mockSchoolId,
        accuracy: 10,
      };

      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const outputWithGeofence: SaveLocationWithETAOutput = {
        ...mockSaveLocationWithETAOutput,
        isWithinGeofence: false,
      };

      jest
        .spyOn(saveLocationWithETAUseCaseMock, 'execute')
        .mockResolvedValue(outputWithGeofence);

      const result = await controller.saveLocation(
        mockRequest,
        saveLocationDto,
      );

      expect(result.isWithinGeofence).toBe(false);
      expect(result.location).toEqual(mockLocation);
      expect(result.eta).toEqual(mockETA);
      expect(result.durationMinutes).toBe(5);
    });

    it('should return ETA with calculated duration in minutes', async () => {
      const saveLocationDto: SaveLocationDto = {
        lat: -23.5505,
        lng: -46.6333,
        schoolId: mockSchoolId,
      };

      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const outputWithLongETA: SaveLocationWithETAOutput = {
        ...mockSaveLocationWithETAOutput,
        durationMinutes: 25,
      };

      jest
        .spyOn(saveLocationWithETAUseCaseMock, 'execute')
        .mockResolvedValue(outputWithLongETA);

      const result = await controller.saveLocation(
        mockRequest,
        saveLocationDto,
      );

      expect(result.durationMinutes).toBe(25);
    });
  });

  describe('getMyLocations (GET /locations/me)', () => {
    it('should return parent locations with status', async () => {
      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const locationWithStatus: LocationWithStatus = {
        ...mockLocation,
        status: 'active',
      };

      const mockOutput: GetParentLocationsOutput = {
        locations: [locationWithStatus],
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue(mockOutput);

      const result = await controller.getMyLocations(mockRequest);

      expect(result).toEqual(mockOutput);
      expect(getParentLocationsUseCaseMock.execute).toHaveBeenCalledWith({
        parentId: mockParentId,
      });
    });

    it('should extract parentId from JWT request.user.sub', async () => {
      const mockRequest = {
        user: {
          sub: 'jwt-parent-id-456',
        },
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue({ locations: [] });

      await controller.getMyLocations(mockRequest);

      expect(getParentLocationsUseCaseMock.execute).toHaveBeenCalledWith({
        parentId: 'jwt-parent-id-456',
      });
    });

    it('should return multiple locations with mixed status (active/expired)', async () => {
      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const recentLocation: LocationWithStatus = {
        ...mockLocation,
        status: 'active',
      };

      const oldLocation: LocationWithStatus = {
        ...mockLocation,
        id: 'location-old',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        status: 'expired',
      };

      const mockOutput: GetParentLocationsOutput = {
        locations: [recentLocation, oldLocation],
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue(mockOutput);

      const result = await controller.getMyLocations(mockRequest);

      expect(result.locations).toHaveLength(2);
      expect(result.locations[0].status).toBe('active');
      expect(result.locations[1].status).toBe('expired');
    });

    it('should return empty locations array when parent has no locations', async () => {
      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const mockOutput: GetParentLocationsOutput = {
        locations: [],
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue(mockOutput);

      const result = await controller.getMyLocations(mockRequest);

      expect(result.locations).toEqual([]);
      expect(result.locations).toHaveLength(0);
    });

    it('should correctly determine active locations (< 30 minutes old)', async () => {
      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const activeLocation: LocationWithStatus = {
        ...mockLocation,
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        status: 'active',
      };

      const mockOutput: GetParentLocationsOutput = {
        locations: [activeLocation],
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue(mockOutput);

      const result = await controller.getMyLocations(mockRequest);

      expect(result.locations[0].status).toBe('active');
    });

    it('should correctly determine expired locations (>= 30 minutes old)', async () => {
      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const expiredLocation: LocationWithStatus = {
        ...mockLocation,
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        status: 'expired',
      };

      const mockOutput: GetParentLocationsOutput = {
        locations: [expiredLocation],
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue(mockOutput);

      const result = await controller.getMyLocations(mockRequest);

      expect(result.locations[0].status).toBe('expired');
    });

    it('should handle GetParentLocationsUseCase error', async () => {
      const mockRequest = {
        user: {
          sub: 'non-existent-parent',
        },
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockRejectedValue(
          new Error('Parent with id non-existent-parent not found'),
        );

      await expect(controller.getMyLocations(mockRequest)).rejects.toThrow(
        'Parent with id non-existent-parent not found',
      );
    });

    it('should return locations ordered by timestamp (newest first)', async () => {
      const mockRequest = {
        user: {
          sub: mockParentId,
        },
      };

      const newestLocation: LocationWithStatus = {
        ...mockLocation,
        id: 'location-newest',
        timestamp: new Date(),
        status: 'active',
      };

      const olderLocation: LocationWithStatus = {
        ...mockLocation,
        id: 'location-older',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        status: 'active',
      };

      const mockOutput: GetParentLocationsOutput = {
        locations: [newestLocation, olderLocation],
      };

      jest
        .spyOn(getParentLocationsUseCaseMock, 'execute')
        .mockResolvedValue(mockOutput);

      const result = await controller.getMyLocations(mockRequest);

      expect(result.locations[0].id).toBe('location-newest');
      expect(result.locations[1].id).toBe('location-older');
    });
  });
});
