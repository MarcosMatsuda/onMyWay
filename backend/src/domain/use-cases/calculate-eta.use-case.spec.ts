import { CalculateETAUseCase } from './calculate-eta.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { IOSRMServiceAdapter } from './calculate-eta.use-case';
import { ETA } from '../entities/eta.entity';
import { Location } from '../entities/location.entity';
import { School } from '../entities/school.entity';
import { Parent } from '../entities/parent.entity';

describe('CalculateETAUseCase', () => {
  let useCase: CalculateETAUseCase;
  let etaRepositoryMock: jest.Mocked<IETARepository>;
  let locationRepositoryMock: jest.Mocked<ILocationRepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;
  let osrmServiceMock: jest.Mocked<IOSRMServiceAdapter>;

  const mockParent: Parent = {
    id: 'parent-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+5511999999999',
    schoolId: 'school-456',
    createdAt: new Date(),
  };

  const mockSchool: School = {
    id: 'school-456',
    name: 'Springfield Elementary',
    lat: -23.55052,
    lng: -46.633308,
    geofenceRadiusMeters: 500,
    notificationThresholdMeters: 1000,
    createdAt: new Date(),
  };

  const mockLocation: Location = {
    id: 'location-789',
    parentId: 'parent-123',
    lat: -23.5505,
    lng: -46.6333,
    accuracy: 10,
    timestamp: new Date(),
  };

  const mockETA: ETA = {
    id: 'eta-999',
    parentId: 'parent-123',
    schoolId: 'school-456',
    distanceMeters: 1500,
    durationSeconds: 300, // 5 minutes
    routePolyline: 'polyline-string',
    calculatedAt: new Date(),
  };

  const mockRoute = {
    distanceMeters: 1500,
    durationSeconds: 300,
    polyline: 'polyline-string',
  };

  beforeEach(() => {
    // Create mocks
    etaRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findLatestByParentId: jest.fn(),
      findBySchoolId: jest.fn(),
    } as jest.Mocked<IETARepository>;

    locationRepositoryMock = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findParentsNearSchool: jest.fn(),
    } as jest.Mocked<ILocationRepository>;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISchoolRepository>;

    parentRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySchoolId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validateCredentials: jest.fn(),
    } as jest.Mocked<IParentRepository>;

    osrmServiceMock = {
      calculateRoute: jest.fn(),
    } as jest.Mocked<IOSRMServiceAdapter>;

    // Instantiate use case directly
    useCase = new CalculateETAUseCase(
      etaRepositoryMock,
      locationRepositoryMock,
      schoolRepositoryMock,
      parentRepositoryMock,
      osrmServiceMock,
    );
  });

  describe('execute', () => {
    it('should calculate ETA successfully', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(mockLocation);
      osrmServiceMock.calculateRoute.mockResolvedValue(mockRoute);
      etaRepositoryMock.save.mockResolvedValue(mockETA);

      const input = {
        parentId: 'parent-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(parentRepositoryMock.findById).toHaveBeenCalledWith('parent-123');
      expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
      expect(locationRepositoryMock.findLatestByParentId).toHaveBeenCalledWith('parent-123');
      expect(osrmServiceMock.calculateRoute).toHaveBeenCalledWith(
        mockLocation.lat,
        mockLocation.lng,
        mockSchool.lat,
        mockSchool.lng,
      );
      expect(etaRepositoryMock.save).toHaveBeenCalled();
      expect(result.eta).toEqual(mockETA);
      expect(result.distanceMeters).toBe(1500);
      expect(result.durationMinutes).toBe(5); // 300 seconds / 60
    });

    it('should throw error when parent not found', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(null);

      const input = {
        parentId: 'non-existent-parent',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Parent with id non-existent-parent not found',
      );
    });

    it('should throw error when school not found', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(null);

      const input = {
        parentId: 'parent-123',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'School with id school-456 not found',
      );
    });

    it('should throw error when no location found for parent', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(null);

      const input = {
        parentId: 'parent-123',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'No location found for parent parent-123',
      );
    });

    it('should handle OSRM service errors', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(mockLocation);
      osrmServiceMock.calculateRoute.mockRejectedValue(new Error('OSRM service unavailable'));

      const input = {
        parentId: 'parent-123',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('OSRM service unavailable');
    });

    it('should round duration minutes correctly', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      locationRepositoryMock.findLatestByParentId.mockResolvedValue(mockLocation);
      osrmServiceMock.calculateRoute.mockResolvedValue({
        ...mockRoute,
        durationSeconds: 185, // 3.08333 minutes
      });
      etaRepositoryMock.save.mockResolvedValue({
        ...mockETA,
        durationSeconds: 185,
      });

      const input = {
        parentId: 'parent-123',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.durationMinutes).toBe(3); // Rounded from 3.08333
    });
  });
});