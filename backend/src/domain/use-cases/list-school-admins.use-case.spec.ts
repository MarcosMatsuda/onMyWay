import { NotFoundException } from '@nestjs/common';
import { ListSchoolAdminsUseCase } from './list-school-admins.use-case';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { User } from '../entities/user.entity';
import { School } from '../entities/school.entity';

describe('ListSchoolAdminsUseCase', () => {
  let useCase: ListSchoolAdminsUseCase;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;

  const mockSchool: School = {
    id: 'school-123',
    name: 'Test School',
    lat: -23.5505,
    lng: -46.6333,
    geofenceRadiusMeters: 500,
    notificationThresholdMeters: 1000,
    inviteCode: 'AB3X7Y2Z',
    createdAt: new Date(),
  };

  const mockAdmins: User[] = [
    {
      id: 'user-1',
      name: 'Admin One',
      email: 'admin1@school.com',
      role: 'school_admin',
      schoolId: 'school-123',
      createdAt: new Date(),
    },
    {
      id: 'user-2',
      name: 'Admin Two',
      email: 'admin2@school.com',
      role: 'school_admin',
      schoolId: 'school-123',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    userRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySchoolId: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      validateCredentials: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    } as any;

    useCase = new ListSchoolAdminsUseCase(
      userRepositoryMock,
      schoolRepositoryMock,
    );
  });

  it('should return admins for a valid school', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    userRepositoryMock.findBySchoolId.mockResolvedValue(mockAdmins);

    const result = await useCase.execute('school-123');

    expect(result.admins).toEqual(mockAdmins);
    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-123');
    expect(userRepositoryMock.findBySchoolId).toHaveBeenCalledWith(
      'school-123',
    );
  });

  it('should return empty array when school has no admins', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    userRepositoryMock.findBySchoolId.mockResolvedValue([]);

    const result = await useCase.execute('school-123');

    expect(result.admins).toEqual([]);
  });

  it('should throw NotFoundException when school does not exist', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-school')).rejects.toThrow(
      NotFoundException,
    );

    expect(userRepositoryMock.findBySchoolId).not.toHaveBeenCalled();
  });
});
