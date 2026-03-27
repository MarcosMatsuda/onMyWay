import { GetSchoolArrivalsUseCase } from './get-school-arrivals.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { School } from '../entities/school.entity';

describe('GetSchoolArrivalsUseCase', () => {
  let useCase: GetSchoolArrivalsUseCase;
  let etaRepositoryMock: jest.Mocked<IETARepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;
  let locationRepositoryMock: jest.Mocked<ILocationRepository>;

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
  ];

  const mockLocations = [
    {
      id: 'location-1',
      parentId: 'parent-1',
      lat: -23.551,
      lng: -46.634,
      accuracy: 10.5,
      timestamp: new Date(),
    },
    {
      id: 'location-2',
      parentId: 'parent-2',
      lat: -23.552,
      lng: -46.635,
      accuracy: 12.3,
      timestamp: new Date(),
    },
  ];

  const mockETAs = [
    {
      id: 'eta-1',
      parentId: 'parent-1',
      schoolId: 'school-456',
      durationSeconds: 900, // 15 minutes
      distanceMeters: 1200,
      routePolyline: 'encoded_polyline_1',
      calculatedAt: new Date(),
    },
    {
      id: 'eta-2',
      parentId: 'parent-2',
      schoolId: 'school-456',
      durationSeconds: 600, // 10 minutes
      distanceMeters: 800,
      routePolyline: 'encoded_polyline_2',
      calculatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    etaRepositoryMock = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findBySchoolId: jest.fn(),
      findLatestBulkByParentIds: jest.fn(),
    } as any;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    } as any;

    parentRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByIds: jest.fn(),
    } as any;

    locationRepositoryMock = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findParentsNearSchool: jest.fn(),
      findLatestBulkByParentIds: jest.fn(),
    } as any;

    useCase = new GetSchoolArrivalsUseCase(
      etaRepositoryMock,
      schoolRepositoryMock,
      parentRepositoryMock,
      locationRepositoryMock,
    );
  });

  it('should return arrivals queue for a school using bulk queries', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    // Mock bulk queries instead of individual queries
    const etasMap = new Map([
      ['parent-1', mockETAs[0]],
      ['parent-2', mockETAs[1]],
    ]);
    etaRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(etasMap);

    const parentsMap = new Map([
      ['parent-1', mockParents[0]],
      ['parent-2', mockParents[1]],
    ]);
    parentRepositoryMock.findByIds.mockResolvedValue(parentsMap);

    const locationsMap = new Map([
      ['parent-1', mockLocations[0]],
      ['parent-2', mockLocations[1]],
    ]);
    locationRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(
      locationsMap,
    );

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
    expect(schoolRepositoryMock.findParentsWithinGeofence).toHaveBeenCalledWith(
      'school-456',
    );

    // Verify bulk methods were called instead of individual ones
    expect(etaRepositoryMock.findLatestBulkByParentIds).toHaveBeenCalledWith(
      ['parent-1', 'parent-2'],
      5, // ETA_TTL_MINUTES
    );
    expect(parentRepositoryMock.findByIds).toHaveBeenCalledWith([
      'parent-1',
      'parent-2',
    ]);
    expect(
      locationRepositoryMock.findLatestBulkByParentIds,
    ).toHaveBeenCalledWith(['parent-1', 'parent-2']);

    expect(result.schoolName).toBe('Springfield Elementary');
    expect(result.totalCount).toBe(2);
    expect(result.arrivals).toHaveLength(2);

    // Should be sorted by ETA (10 minutes first, then 15 minutes)
    expect(result.arrivals[0].parentId).toBe('parent-2'); // 10 minutes
    expect(result.arrivals[0].etaMinutes).toBe(10);
    expect(result.arrivals[1].parentId).toBe('parent-1'); // 15 minutes
    expect(result.arrivals[1].etaMinutes).toBe(15);
  });

  it('should throw error if school not found', async () => {
    // Arrange
    const input = { schoolId: 'non-existent-school' };
    schoolRepositoryMock.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      'School with id non-existent-school not found',
    );
  });

  it('should apply limit when specified', async () => {
    // Arrange
    const input = { schoolId: 'school-456', limit: 1 };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    const etasMap = new Map([
      ['parent-1', mockETAs[0]],
      ['parent-2', mockETAs[1]],
    ]);
    etaRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(etasMap);

    const parentsMap = new Map([
      ['parent-1', mockParents[0]],
      ['parent-2', mockParents[1]],
    ]);
    parentRepositoryMock.findByIds.mockResolvedValue(parentsMap);

    const locationsMap = new Map([
      ['parent-1', mockLocations[0]],
      ['parent-2', mockLocations[1]],
    ]);
    locationRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(
      locationsMap,
    );

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.arrivals).toHaveLength(1); // Limited to 1
    expect(result.totalCount).toBe(2); // But total count should still be 2
  });

  it('should skip parents without ETA', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    // Only parent-1 has ETA
    const etasMap = new Map([['parent-1', mockETAs[0]]]);
    etaRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(etasMap);

    const parentsMap = new Map([['parent-1', mockParents[0]]]);
    parentRepositoryMock.findByIds.mockResolvedValue(parentsMap);

    const locationsMap = new Map([['parent-1', mockLocations[0]]]);
    locationRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(
      locationsMap,
    );

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.arrivals).toHaveLength(1);
    expect(result.arrivals[0].parentId).toBe('parent-1');
  });

  it('should skip parents with ETA for wrong school', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
    ]);

    // ETA is for a different school
    const wrongSchoolETA = {
      ...mockETAs[0],
      schoolId: 'different-school',
      routePolyline: 'encoded_polyline_1',
    };

    const etasMap = new Map([['parent-1', wrongSchoolETA]]);
    etaRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(etasMap);

    const parentsMap = new Map([['parent-1', mockParents[0]]]);
    parentRepositoryMock.findByIds.mockResolvedValue(parentsMap);

    const locationsMap = new Map([['parent-1', mockLocations[0]]]);
    locationRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(
      locationsMap,
    );

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.arrivals).toHaveLength(0);
  });

  it('should filter out ETAs older than TTL (6 min) and include recent ones (4 min)', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    const now = Date.now();
    // parent-1 has stale ETA (6 min ago) - filtered out by repository
    // parent-2 has recent ETA (4 min ago) - should be included
    const recentETA = {
      ...mockETAs[1],
      parentId: 'parent-2',
      calculatedAt: new Date(now - 4 * 60 * 1000), // 4 minutes ago (should be included)
    };

    // Mock repository to return only the recent ETA (TTL filter applied)
    const etasMap = new Map([['parent-2', recentETA]]);
    etaRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(etasMap);

    const parentsMap = new Map([
      ['parent-1', mockParents[0]],
      ['parent-2', mockParents[1]],
    ]);
    parentRepositoryMock.findByIds.mockResolvedValue(parentsMap);

    const locationsMap = new Map([
      ['parent-1', mockLocations[0]],
      ['parent-2', mockLocations[1]],
    ]);
    locationRepositoryMock.findLatestBulkByParentIds.mockResolvedValue(
      locationsMap,
    );

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(etaRepositoryMock.findLatestBulkByParentIds).toHaveBeenCalledWith(
      ['parent-1', 'parent-2'],
      5, // ETA_TTL_MINUTES
    );
    expect(result.arrivals).toHaveLength(1);
    expect(result.arrivals[0].parentId).toBe('parent-2'); // Only recent ETA
    expect(result.totalCount).toBe(1);
  });
});
