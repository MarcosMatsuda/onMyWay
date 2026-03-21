import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { SaveLocationUseCase } from '../../domain/use-cases/save-location.use-case';
import { CalculateETAUseCase } from '../../domain/use-cases/calculate-eta.use-case';
import {
  ILocationRepository,
  LOCATION_REPOSITORY,
} from '../../domain/repositories/location.repository.interface';
import {
  IETARepository,
  ETA_REPOSITORY,
} from '../../domain/repositories/eta.repository.interface';
import { CreateLocationDto } from './dtos/create-location.dto';
import { Location } from '../../domain/entities/location.entity';
import { ETA } from '../../domain/entities/eta.entity';

describe('LocationsService', () => {
  let service: LocationsService;
  let saveLocationUseCaseMock: jest.Mocked<SaveLocationUseCase>;
  let calculateETAUseCaseMock: jest.Mocked<CalculateETAUseCase>;
  let locationRepositoryMock: jest.Mocked<ILocationRepository>;
  let etaRepositoryMock: jest.Mocked<IETARepository>;

  const mockLocation: Location = {
    id: 'location-123',
    parentId: 'parent-456',
    lat: -23.55052,
    lng: -46.633308,
    accuracy: 10.5,
    timestamp: new Date(),
  };

  const mockETA: ETA = {
    id: 'eta-789',
    parentId: 'parent-456',
    schoolId: 'school-123',
    durationSeconds: 900, // 15 minutes
    distanceMeters: 1200,
    routePolyline: 'encoded_polyline',
    calculatedAt: new Date(),
  };

  const mockSaveLocationOutput = {
    location: mockLocation,
    isWithinGeofence: true,
  };

  const mockCalculateETAOutput = {
    eta: mockETA,
    distanceMeters: 1200,
    durationMinutes: 15,
  };

  const createLocationDto: CreateLocationDto = {
    lat: -23.55052,
    lng: -46.633308,
    accuracy: 10.5,
  };

  beforeEach(async () => {
    saveLocationUseCaseMock = {
      execute: jest.fn(),
    } as any;

    calculateETAUseCaseMock = {
      execute: jest.fn(),
    } as any;

    locationRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findLatestByParentId: jest.fn(),
      findByParentId: jest.fn(),
      findParentsNearSchool: jest.fn(),
    } as any;

    etaRepositoryMock = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findBySchoolId: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: SaveLocationUseCase,
          useValue: saveLocationUseCaseMock,
        },
        {
          provide: CalculateETAUseCase,
          useValue: calculateETAUseCaseMock,
        },
        {
          provide: LOCATION_REPOSITORY,
          useValue: locationRepositoryMock,
        },
        {
          provide: ETA_REPOSITORY,
          useValue: etaRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('saveLocation', () => {
    it('should save location and calculate ETA successfully', async () => {
      // Arrange
      const parentId = 'parent-456';
      saveLocationUseCaseMock.execute.mockResolvedValue(mockSaveLocationOutput);
      calculateETAUseCaseMock.execute.mockResolvedValue(mockCalculateETAOutput);

      // Act
      const result = await service.saveLocation(parentId, createLocationDto);

      // Assert
      expect(saveLocationUseCaseMock.execute).toHaveBeenCalledWith({
        parentId,
        lat: createLocationDto.lat,
        lng: createLocationDto.lng,
        accuracy: createLocationDto.accuracy,
      });

      expect(calculateETAUseCaseMock.execute).toHaveBeenCalledWith({
        parentId,
      });

      expect(result).toEqual({
        id: 'location-123',
        parentId: 'parent-456',
        lat: -23.55052,
        lng: -46.633308,
        accuracy: 10.5,
        timestamp: mockLocation.timestamp,
        isWithinGeofence: true,
        eta: {
          id: 'eta-789',
          durationSeconds: 900,
          distanceMeters: 1200,
          routePolyline: 'encoded_polyline',
          calculatedAt: mockETA.calculatedAt,
        },
      });
    });

    it('should handle ETA calculation failure gracefully', async () => {
      // Arrange
      const parentId = 'parent-456';
      saveLocationUseCaseMock.execute.mockResolvedValue(mockSaveLocationOutput);
      calculateETAUseCaseMock.execute.mockRejectedValue(
        new Error('ETA calculation failed'),
      );

      // Act
      const result = await service.saveLocation(parentId, createLocationDto);

      // Assert
      expect(saveLocationUseCaseMock.execute).toHaveBeenCalled();
      expect(calculateETAUseCaseMock.execute).toHaveBeenCalled();

      // Should still return location data even if ETA calculation failed
      expect(result).toEqual({
        id: 'location-123',
        parentId: 'parent-456',
        lat: -23.55052,
        lng: -46.633308,
        accuracy: 10.5,
        timestamp: mockLocation.timestamp,
        isWithinGeofence: true,
        // No eta property since calculation failed
      });
      expect(result.eta).toBeUndefined();
    });

    it('should handle missing accuracy in DTO', async () => {
      // Arrange
      const parentId = 'parent-456';
      const createLocationDtoWithoutAccuracy: CreateLocationDto = {
        lat: -23.55052,
        lng: -46.633308,
      };

      const mockLocationWithoutAccuracy: Location = {
        ...mockLocation,
        accuracy: undefined,
      };

      const mockSaveLocationOutputWithoutAccuracy = {
        location: mockLocationWithoutAccuracy,
        isWithinGeofence: true,
      };

      saveLocationUseCaseMock.execute.mockResolvedValue(
        mockSaveLocationOutputWithoutAccuracy,
      );
      calculateETAUseCaseMock.execute.mockResolvedValue(mockCalculateETAOutput);

      // Act
      const result = await service.saveLocation(
        parentId,
        createLocationDtoWithoutAccuracy,
      );

      // Assert
      expect(saveLocationUseCaseMock.execute).toHaveBeenCalledWith({
        parentId,
        lat: createLocationDtoWithoutAccuracy.lat,
        lng: createLocationDtoWithoutAccuracy.lng,
        accuracy: undefined,
      });

      expect(result.accuracy).toBeUndefined();
    });
  });

  describe('getMyLatestLocation', () => {
    it('should return latest location with ETA', async () => {
      // Arrange
      const parentId = 'parent-456';
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(
        mockLocation,
      );
      etaRepositoryMock.findLatestByParentId.mockResolvedValue(mockETA);

      // Act
      const result = await service.getMyLatestLocation(parentId);

      // Assert
      expect(locationRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
        parentId,
      );
      expect(etaRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
        parentId,
      );

      expect(result).toEqual({
        id: 'location-123',
        parentId: 'parent-456',
        lat: -23.55052,
        lng: -46.633308,
        accuracy: 10.5,
        timestamp: mockLocation.timestamp,
        isWithinGeofence: false, // Always false for this endpoint
        eta: {
          id: 'eta-789',
          durationSeconds: 900,
          distanceMeters: 1200,
          routePolyline: 'encoded_polyline',
          calculatedAt: mockETA.calculatedAt,
        },
      });
    });

    it('should return null when no location found', async () => {
      // Arrange
      const parentId = 'parent-456';
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(null);

      // Act
      const result = await service.getMyLatestLocation(parentId);

      // Assert
      expect(locationRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
        parentId,
      );
      expect(etaRepositoryMock.findLatestByParentId).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return location without ETA when no ETA found', async () => {
      // Arrange
      const parentId = 'parent-456';
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(
        mockLocation,
      );
      etaRepositoryMock.findLatestByParentId.mockResolvedValue(null);

      // Act
      const result = await service.getMyLatestLocation(parentId);

      // Assert
      expect(locationRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
        parentId,
      );
      expect(etaRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
        parentId,
      );

      expect(result).toEqual({
        id: 'location-123',
        parentId: 'parent-456',
        lat: -23.55052,
        lng: -46.633308,
        accuracy: 10.5,
        timestamp: mockLocation.timestamp,
        isWithinGeofence: false,
        // No eta property
      });
      expect(result?.eta).toBeUndefined();
    });
  });
});
