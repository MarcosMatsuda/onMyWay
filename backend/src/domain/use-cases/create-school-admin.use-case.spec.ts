import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateSchoolAdminUseCase } from './create-school-admin.use-case';
import { IUserRepository } from '../repositories/user.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { User } from '../entities/user.entity';
import { School } from '../entities/school.entity';

jest.mock('bcrypt');

describe('CreateSchoolAdminUseCase', () => {
  let useCase: CreateSchoolAdminUseCase;
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

  const mockUser: User = {
    id: 'user-456',
    name: 'Jane Doe',
    email: 'jane@school.com',
    role: 'school_admin',
    schoolId: 'school-123',
    createdAt: new Date(),
  };

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

    useCase = new CreateSchoolAdminUseCase(
      userRepositoryMock,
      schoolRepositoryMock,
    );
  });

  it('should create a school_admin user successfully', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    userRepositoryMock.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    userRepositoryMock.create.mockResolvedValue(mockUser);

    const result = await useCase.execute({
      name: 'Jane Doe',
      email: 'jane@school.com',
      password: 'SecurePass123',
      schoolId: 'school-123',
    });

    expect(result).toEqual(mockUser);
    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-123');
    expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith(
      'jane@school.com',
    );
    expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123', 10);
    expect(userRepositoryMock.create).toHaveBeenCalledWith({
      name: 'Jane Doe',
      email: 'jane@school.com',
      role: 'school_admin',
      schoolId: 'school-123',
      passwordHash: 'hashed-password',
    });
  });

  it('should throw NotFoundException when school does not exist', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@school.com',
        password: 'SecurePass123',
        schoolId: 'non-existent-school',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(userRepositoryMock.findByEmail).not.toHaveBeenCalled();
    expect(userRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when email already exists', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    userRepositoryMock.findByEmail.mockResolvedValue(mockUser);

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'jane@school.com',
        password: 'SecurePass123',
        schoolId: 'school-123',
      }),
    ).rejects.toThrow(ConflictException);

    expect(userRepositoryMock.create).not.toHaveBeenCalled();
  });
});
