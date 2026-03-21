import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { SaveLocationWithETAUseCase } from '../../domain/use-cases/save-location-with-eta.use-case';
import { NotifySchoolUseCase } from '../../domain/use-cases/notify-school.use-case';
import {
  ILocationRepository,
  LOCATION_REPOSITORY,
} from '../../domain/repositories/location.repository.interface';
import {
  IETARepository,
  ETA_REPOSITORY,
} from '../../domain/repositories/eta.repository.interface';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../../domain/repositories/parent.repository.interface';
import { CreateLocationDto } from './dtos/create-location.dto';
import { Location } from '../../domain/entities/location.entity';
import { ETA } from '../../domain/entities/eta.entity';
import { Parent } from '../../domain/entities/parent.entity';

describe('LocationsService', () => {
  let service: LocationsService;
  let saveLocationWithETAUseCaseMock: jest.Mocked<SaveLocationWithETAUseCase>;
  let notifySchoolUseCaseMock: jest.Mocked<NotifySchoolUseCase>;
  let locationRepositoryMock: jest.Mocked<ILocationRepository>;
  let etaRepositoryMock: jest.Mocked<IETARepository>;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;

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

  const mockParent: Parent = {
    id: 'parent-456',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+5511999999999',
    schoolId: 'school-123',
    createdAt: new Date(),
  };

  const mockSaveLocationWithETAOutput = {
    location: mockLocation,
    eta: mockETA,
    distanceMeters: 1200,
    durationMinutes: 15,
    isWithinGeofence: true,
  };

  const createLocationDto: CreateLocationDto = {
    lat: -23.55052,
    lng: -46.633308,
    accuracy: 10.5,
  };

  beforeEach(async () => {
    saveLocationWithETAUseCaseMock = {
      execute: jest.fn(),
    } as any;

    notifySchoolUseCaseMock = {
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

    parentRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: SaveLocationWithETAUseCase,
          useValue: saveLocationWithETAUseCaseMock,
        },
        {
          provide: NotifySchoolUseCase,
          useValue: notifySchoolUseCaseMock,
        },
        {
          provide: LOCATION_REPOSITORY,
          useValue: locationRepositoryMock,
        },
        {
          provide: ETA_REPOSITORY,
          useValue: etaRepositoryMock,
        },
        {
          provide: PARENT_REPOSITORY,
          useValue: parentRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
  });

  describe('saveLocation', () => {
    it('should save location and calculate ETA using SaveLocationWithETAUseCase', async () => {
      // Arrange
      const parentId = 'parent-456';
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      saveLocationWithETAUseCaseMock.execute.mockResolvedValue(
        mockSaveLocationWithETAOutput,
      );
      etaRepositoryMock.findLatestByParentId.mockResolvedValue(mockETA);
      notifySchoolUseCaseMock.execute.mockResolvedValue(undefined);

      // Act
      const result = await service.saveLocation(parentId, createLocationDto);

      // Assert
      expect(parentRepositoryMock.findById).toHaveBeenCalledWith(parentId);
      expect(saveLocationWithETAUseCaseMock.execute).toHaveBeenCalledWith({
        parentId,
        lat: createLocationDto.lat,
        lng: createLocationDto.lng,
        accuracy: createLocationDto.accuracy,
        schoolId: 'school-123',
      });

      expect(notifySchoolUseCaseMock.execute).toHaveBeenCalledWith({
        schoolId: 'school-123',
        parentId,
        eta: mockETA,
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

    it('should throw error when parent school cannot be determined', async () => {
      // Arrange
      const parentId = 'parent-456';
      parentRepositoryMock.findById.mockResolvedValue(null);
      etaRepositoryMock.findLatestByParentId.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.saveLocation(parentId, createLocationDto),
      ).rejects.toThrow(`Cannot determine school for parent ${parentId}`);

      expect(saveLocationWithETAUseCaseMock.execute).not.toHaveBeenCalled();
      expect(notifySchoolUseCaseMock.execute).not.toHaveBeenCalled();
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

      const mockOutputWithoutAccuracy = {
        ...mockSaveLocationWithETAOutput,
        location: mockLocationWithoutAccuracy,
      };

      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      saveLocationWithETAUseCaseMock.execute.mockResolvedValue(
        mockOutputWithoutAccuracy,
      );
      etaRepositoryMock.findLatestByParentId.mockResolvedValue(mockETA);
      notifySchoolUseCaseMock.execute.mockResolvedValue(undefined);

      // Act
      const result = await service.saveLocation(
        parentId,
        createLocationDtoWithoutAccuracy,
      );

      // Assert
      expect(saveLocationWithETAUseCaseMock.execute).toHaveBeenCalledWith({
        parentId,
        lat: createLocationDtoWithoutAccuracy.lat,
        lng: createLocationDtoWithoutAccuracy.lng,
        accuracy: undefined,
        schoolId: 'school-123',
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
