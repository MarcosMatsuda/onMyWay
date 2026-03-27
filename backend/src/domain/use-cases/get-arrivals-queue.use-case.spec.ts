import { GetArrivalsQueueUseCase } from './get-arrivals-queue.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { ETA } from '../entities/eta.entity';
import { School } from '../entities/school.entity';

describe('GetArrivalsQueueUseCase', () => {
  let useCase: GetArrivalsQueueUseCase;
  let etaRepositoryMock: jest.Mocked<IETARepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;

  const mockSchool: School = {
    id: 'school-456',
    name: 'Springfield Elementary',
    lat: -23.55052,
    lng: -46.633308,
    geofenceRadiusMeters: 500,
    notificationThresholdMeters: 1000,
    createdAt: new Date(),
  };

  const mockParents = [
    {
      id: 'parent-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+5511999999999',
      schoolId: 'school-456',
      createdAt: new Date(),
    },
    {
      id: 'parent-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+5511888888888',
      schoolId: 'school-456',
      createdAt: new Date(),
    },
    {
      id: 'parent-3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      phone: '+5511777777777',
      schoolId: 'school-456',
      createdAt: new Date(),
    },
  ];

  const mockETAs: ETA[] = [
    {
      id: 'eta-1',
      parentId: 'parent-1',
      schoolId: 'school-456',
      distanceMeters: 1500,
      durationSeconds: 600, // 10 minutes
      routePolyline: 'polyline-1',
      calculatedAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'eta-2',
      parentId: 'parent-2',
      schoolId: 'school-456',
      distanceMeters: 800,
      durationSeconds: 300, // 5 minutes
      routePolyline: 'polyline-2',
      calculatedAt: new Date('2024-01-01T10:05:00Z'),
    },
    {
      id: 'eta-3',
      parentId: 'parent-3',
      schoolId: 'school-456',
      distanceMeters: 2000,
      durationSeconds: 900, // 15 minutes
      routePolyline: 'polyline-3',
      calculatedAt: new Date('2024-01-01T10:10:00Z'),
    },
  ];

  beforeEach(() => {
    // Create mocks
    etaRepositoryMock = {
      save: jest.fn(),
      findById: jest.fn(),
      findLatestByParentId: jest.fn(),
      findBySchoolId: jest.fn(),
      findLatestBulkByParentIds: jest.fn(),
      deleteByParentId: jest.fn(),
    } as jest.Mocked<IETARepository>;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
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
    useCase = new GetArrivalsQueueUseCase(
      etaRepositoryMock,
      schoolRepositoryMock,
      parentRepositoryMock,
    );
  });

  describe('execute', () => {
    it('should return arrivals queue sorted by ETA (soonest first)', async () => {
      // Arrange
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      etaRepositoryMock.findBySchoolId.mockResolvedValue(mockETAs);

      // Mock parent repository to return different parents for different IDs
      parentRepositoryMock.findById.mockImplementation(async (id) => {
        return mockParents.find((p) => p.id === id) || null;
      });

      const input = {
        schoolId: 'school-456',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
      expect(etaRepositoryMock.findBySchoolId).toHaveBeenCalledWith(
        'school-456',
      );

      // Should be sorted by ETA (ascending): 5min, 10min, 15min
      expect(result.arrivals).toHaveLength(3);
      expect(result.arrivals[0].parentId).toBe('parent-2'); // 5 minutes
      expect(result.arrivals[0].etaMinutes).toBe(5);
      expect(result.arrivals[0].parentName).toBe('Jane Smith');

      expect(result.arrivals[1].parentId).toBe('parent-1'); // 10 minutes
      expect(result.arrivals[1].etaMinutes).toBe(10);

      expect(result.arrivals[2].parentId).toBe('parent-3'); // 15 minutes
      expect(result.arrivals[2].etaMinutes).toBe(15);

      expect(result.schoolName).toBe('Springfield Elementary');
      expect(result.totalCount).toBe(3);
    });

    it('should apply limit when specified', async () => {
      // Arrange
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      etaRepositoryMock.findBySchoolId.mockResolvedValue(mockETAs);

      parentRepositoryMock.findById.mockImplementation(async (id) => {
        return mockParents.find((p) => p.id === id) || null;
      });

      const input = {
        schoolId: 'school-456',
        limit: 2,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.arrivals).toHaveLength(2); // Limited to 2
      expect(result.totalCount).toBe(3); // But total count is still 3
      expect(result.arrivals[0].parentId).toBe('parent-2'); // First: 5min
      expect(result.arrivals[1].parentId).toBe('parent-1'); // Second: 10min
    });

    it('should throw error when school not found', async () => {
      // Arrange
      schoolRepositoryMock.findById.mockResolvedValue(null);

      const input = {
        schoolId: 'non-existent-school',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'School with id non-existent-school not found',
      );
    });

    it('should throw error when parent not found for an ETA', async () => {
      // Arrange
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      etaRepositoryMock.findBySchoolId.mockResolvedValue([mockETAs[0]]);
      parentRepositoryMock.findById.mockResolvedValue(null); // Parent not found

      const input = {
        schoolId: 'school-456',
      };

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(
        'Parent with id parent-1 not found',
      );
    });

    it('should handle empty ETAs list', async () => {
      // Arrange
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      etaRepositoryMock.findBySchoolId.mockResolvedValue([]);

      const input = {
        schoolId: 'school-456',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.arrivals).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.schoolName).toBe('Springfield Elementary');
    });

    it('should round ETA minutes correctly', async () => {
      // Arrange
      const etaWithFractionalMinutes: ETA = {
        id: 'eta-4',
        parentId: 'parent-1',
        schoolId: 'school-456',
        distanceMeters: 1000,
        durationSeconds: 185, // 3.08333 minutes
        routePolyline: 'polyline-4',
        calculatedAt: new Date(),
      };

      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      etaRepositoryMock.findBySchoolId.mockResolvedValue([
        etaWithFractionalMinutes,
      ]);
      parentRepositoryMock.findById.mockResolvedValue(mockParents[0]);

      const input = {
        schoolId: 'school-456',
      };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.arrivals[0].etaMinutes).toBe(3); // Rounded from 3.08333
    });
  });
});
