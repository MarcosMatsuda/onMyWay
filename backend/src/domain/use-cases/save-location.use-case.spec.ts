import { SaveLocationUseCase } from './save-location.use-case';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { Location } from '../entities/location.entity';
import { School } from '../entities/school.entity';
import { Parent } from '../entities/parent.entity';

describe('SaveLocationUseCase', () => {
  let useCase: SaveLocationUseCase;
  let locationRepositoryMock: jest.Mocked<ILocationRepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;

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
    inviteCode: 'AB3X7Y2Z',
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

  beforeEach(() => {
    // Create mocks
    locationRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findLatestByParentId: jest.fn(),
      findByParentId: jest.fn(),
      findParentsNearSchool: jest.fn(),
      findLatestBulkByParentIds: jest.fn(),
    } as jest.Mocked<ILocationRepository>;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
      findByInviteCode: jest.fn(),
    } as jest.Mocked<ISchoolRepository>;

    parentRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySchoolId: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validateCredentials: jest.fn(),
    } as jest.Mocked<IParentRepository>;

    // Instantiate use case directly
    useCase = new SaveLocationUseCase(
      locationRepositoryMock,
      schoolRepositoryMock,
      parentRepositoryMock,
    );
  });

  describe('execute', () => {
    it('should save location and return with geofence check (within geofence)', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      locationRepositoryMock.save.mockResolvedValue(mockLocation);

      const input = {
        parentId: 'parent-123',
        lat: -23.5505, // Very close to school
        lng: -46.6333,
        accuracy: 10,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(parentRepositoryMock.findById).toHaveBeenCalledWith('parent-123');
      expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
      expect(locationRepositoryMock.save).toHaveBeenCalled();
      expect(result.location).toEqual(mockLocation);
      expect(result.isWithinGeofence).toBe(true);
    });

    it('should save location and return with geofence check (outside geofence)', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      locationRepositoryMock.save.mockResolvedValue({
        ...mockLocation,
        lat: -23.56, // Further away (~1.1km)
        lng: -46.6333,
      });

      const input = {
        parentId: 'parent-123',
        lat: -23.56,
        lng: -46.6333,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.isWithinGeofence).toBe(false);
    });

    it('should throw error when parent not found', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(null);

      const input = {
        parentId: 'non-existent-parent',
        lat: -23.5505,
        lng: -46.6333,
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
        lat: -23.5505,
        lng: -46.6333,
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'School with id school-456 not found',
      );
    });

    it('should use default accuracy when not provided', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);

      // Mock should return location with accuracy 0
      locationRepositoryMock.save.mockImplementation(async (locationData) => {
        return {
          ...(locationData as Location),
          id: 'location-789',
          timestamp: new Date(),
        };
      });

      const input = {
        parentId: 'parent-123',
        lat: -23.5505,
        lng: -46.6333,
        // No accuracy provided
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.location.accuracy).toBe(0); // Default from use case
    });
  });
});
