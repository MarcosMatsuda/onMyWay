import { UpdateSchoolConfigUseCase } from './update-school-config.use-case';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';

describe('UpdateSchoolConfigUseCase', () => {
  let useCase: UpdateSchoolConfigUseCase;
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

  const updatedSchool: School = {
    ...mockSchool,
    geofenceRadiusMeters: 750,
    notificationThresholdMeters: 1500,
    inviteCode: 'AB3X7Y2Z',
  };

  beforeEach(() => {
    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    } as any;

    useCase = new UpdateSchoolConfigUseCase(schoolRepositoryMock);
  });

  it('should update school configuration', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      geofenceRadiusMeters: 750,
      notificationThresholdMeters: 1500,
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.update.mockResolvedValue(updatedSchool);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
    expect(schoolRepositoryMock.update).toHaveBeenCalledWith('school-456', {
      geofenceRadiusMeters: 750,
      notificationThresholdMeters: 1500,
    });

    expect(result.id).toBe('school-456');
    expect(result.name).toBe('Springfield Elementary');
    expect(result.geofenceRadiusMeters).toBe(750);
    expect(result.notificationThresholdMeters).toBe(1500);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw error if school not found', async () => {
    // Arrange
    const input = {
      schoolId: 'non-existent-school',
      geofenceRadiusMeters: 750,
    };

    schoolRepositoryMock.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      'School with id non-existent-school not found',
    );
  });

  it('should update only geofence radius when specified', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      geofenceRadiusMeters: 750,
    };

    const partiallyUpdatedSchool: School = {
      ...mockSchool,
      geofenceRadiusMeters: 750,
      inviteCode: 'AB3X7Y2Z',
      // notificationThresholdMeters remains 1000
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.update.mockResolvedValue(partiallyUpdatedSchool);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(schoolRepositoryMock.update).toHaveBeenCalledWith('school-456', {
      geofenceRadiusMeters: 750,
    });

    expect(result.geofenceRadiusMeters).toBe(750);
    expect(result.notificationThresholdMeters).toBe(1000); // unchanged
  });

  it('should update only notification threshold when specified', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      notificationThresholdMeters: 1500,
    };

    const partiallyUpdatedSchool: School = {
      ...mockSchool,
      // geofenceRadiusMeters remains 500
      notificationThresholdMeters: 1500,
      inviteCode: 'AB3X7Y2Z',
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.update.mockResolvedValue(partiallyUpdatedSchool);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(schoolRepositoryMock.update).toHaveBeenCalledWith('school-456', {
      notificationThresholdMeters: 1500,
    });

    expect(result.geofenceRadiusMeters).toBe(500); // unchanged
    expect(result.notificationThresholdMeters).toBe(1500);
  });

  it('should validate geofence radius minimum value', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      geofenceRadiusMeters: 50, // below minimum
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      'Geofence radius must be between 100 and 5000 meters',
    );
  });

  it('should validate geofence radius maximum value', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      geofenceRadiusMeters: 6000, // above maximum
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      'Geofence radius must be between 100 and 5000 meters',
    );
  });

  it('should validate notification threshold minimum value', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      notificationThresholdMeters: 50, // below minimum
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      'Notification threshold must be between 100 and 10000 meters',
    );
  });

  it('should validate notification threshold maximum value', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      notificationThresholdMeters: 15000, // above maximum
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(
      'Notification threshold must be between 100 and 10000 meters',
    );
  });

  it('should accept valid boundary values', async () => {
    // Arrange
    const input = {
      schoolId: 'school-456',
      geofenceRadiusMeters: 100, // minimum
      notificationThresholdMeters: 10000, // maximum
    };

    const boundaryUpdatedSchool: School = {
      ...mockSchool,
      geofenceRadiusMeters: 100,
      notificationThresholdMeters: 10000,
      inviteCode: 'AB3X7Y2Z',
    };

    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    schoolRepositoryMock.update.mockResolvedValue(boundaryUpdatedSchool);

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.geofenceRadiusMeters).toBe(100);
    expect(result.notificationThresholdMeters).toBe(10000);
  });
});
