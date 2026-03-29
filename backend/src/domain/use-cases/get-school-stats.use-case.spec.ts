import { GetSchoolStatsUseCase } from './get-school-stats.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';

describe('GetSchoolStatsUseCase', () => {
  let useCase: GetSchoolStatsUseCase;
  let etaRepositoryMock: jest.Mocked<IETARepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;

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

  const mockETAs = [
    {
      id: 'eta-1',
      parentId: 'parent-1',
      schoolId: 'school-456',
      durationSeconds: 180, // 3 minutes
      distanceMeters: 500,
      routePolyline: 'encoded_polyline_1',
      calculatedAt: new Date(),
    },
    {
      id: 'eta-2',
      parentId: 'parent-2',
      schoolId: 'school-456',
      durationSeconds: 600, // 10 minutes
      distanceMeters: 1200,
      routePolyline: 'encoded_polyline_2',
      calculatedAt: new Date(),
    },
    {
      id: 'eta-3',
      parentId: 'parent-3',
      schoolId: 'school-456',
      durationSeconds: 1200, // 20 minutes
      distanceMeters: 2000,
      routePolyline: 'encoded_polyline_3',
      calculatedAt: new Date(),
    },
    {
      id: 'eta-4',
      parentId: 'parent-4',
      schoolId: 'school-456',
      durationSeconds: 300, // 5 minutes
      distanceMeters: 800,
      routePolyline: 'encoded_polyline_4',
      calculatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    etaRepositoryMock = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findBySchoolId: jest.fn(),
    } as any;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    } as any;

    useCase = new GetSchoolStatsUseCase(
      etaRepositoryMock,
      schoolRepositoryMock,
    );
  });

  it('should return statistics for a school', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
      'parent-3',
      'parent-4',
    ]);

    etaRepositoryMock.findLatestByParentId
      .mockResolvedValueOnce(mockETAs[0]) // 3 minutes
      .mockResolvedValueOnce(mockETAs[1]) // 10 minutes
      .mockResolvedValueOnce(mockETAs[2]) // 20 minutes
      .mockResolvedValueOnce(mockETAs[3]); // 5 minutes

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
    expect(schoolRepositoryMock.findParentsWithinGeofence).toHaveBeenCalledWith(
      'school-456',
    );
    expect(etaRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
      'parent-1',
      5, // ETA_TTL_MINUTES
    );

    expect(result.totalParents).toBe(4);
    expect(result.avgETA).toBe(9.5); // (3 + 10 + 20 + 5) / 4 = 9.5
    expect(result.etaLessThan5Min).toBe(1); // parent-1: 3 minutes
    expect(result.eta5To15Min).toBe(2); // parent-2: 10 minutes, parent-4: 5 minutes
    expect(result.etaGreaterThan15Min).toBe(1); // parent-3: 20 minutes
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

  it('should return zero statistics when no parents in geofence', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([]);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalParents).toBe(0);
    expect(result.avgETA).toBe(0);
    expect(result.etaLessThan5Min).toBe(0);
    expect(result.eta5To15Min).toBe(0);
    expect(result.etaGreaterThan15Min).toBe(0);
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
    etaRepositoryMock.findLatestByParentId
      .mockResolvedValueOnce(mockETAs[0]) // parent-1: 3 minutes
      .mockResolvedValueOnce(null); // parent-2: no ETA

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalParents).toBe(1); // Only parent-1 counted
    expect(result.avgETA).toBe(3); // Only 3 minutes
    expect(result.etaLessThan5Min).toBe(1);
    expect(result.eta5To15Min).toBe(0);
    expect(result.etaGreaterThan15Min).toBe(0);
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
    etaRepositoryMock.findLatestByParentId.mockResolvedValueOnce(
      wrongSchoolETA,
    );

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalParents).toBe(0); // ETA for wrong school, so not counted
  });

  it('should round average ETA to one decimal place', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    // ETAs that will give a non-integer average
    etaRepositoryMock.findLatestByParentId
      .mockResolvedValueOnce({
        ...mockETAs[0],
        durationSeconds: 420, // 7 minutes
        routePolyline: 'encoded_polyline_1',
      })
      .mockResolvedValueOnce({
        ...mockETAs[1],
        durationSeconds: 540, // 9 minutes
        routePolyline: 'encoded_polyline_2',
      });

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.avgETA).toBe(8); // (7 + 9) / 2 = 8
  });

  it('should return zero totalParents when all ETAs are stale (> 5 min TTL)', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    // Mock repository to return null for both parents (stale ETAs filtered out)
    etaRepositoryMock.findLatestByParentId
      .mockResolvedValueOnce(null) // parent-1: stale ETA (> 5 min)
      .mockResolvedValueOnce(null); // parent-2: stale ETA (> 5 min)

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(etaRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
      'parent-1',
      5, // ETA_TTL_MINUTES
    );
    expect(etaRepositoryMock.findLatestByParentId).toHaveBeenCalledWith(
      'parent-2',
      5, // ETA_TTL_MINUTES
    );
    expect(result.totalParents).toBe(0);
    expect(result.avgETA).toBe(0);
    expect(result.etaLessThan5Min).toBe(0);
    expect(result.eta5To15Min).toBe(0);
    expect(result.etaGreaterThan15Min).toBe(0);
  });

  it('should only count parents with recent ETAs (within 5 min TTL)', async () => {
    // Arrange
    const input = { schoolId: 'school-456' };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.findParentsWithinGeofence.mockResolvedValue([
      'parent-1',
      'parent-2',
    ]);

    // Only parent-2 has recent ETA, parent-1 has stale ETA
    etaRepositoryMock.findLatestByParentId
      .mockResolvedValueOnce(null) // parent-1: stale (> 5 min)
      .mockResolvedValueOnce(mockETAs[1]); // parent-2: recent (10 minutes ETA)

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.totalParents).toBe(1); // Only parent-2
    expect(result.avgETA).toBe(10);
    expect(result.etaLessThan5Min).toBe(0);
    expect(result.eta5To15Min).toBe(1);
    expect(result.etaGreaterThan15Min).toBe(0);
  });
});
