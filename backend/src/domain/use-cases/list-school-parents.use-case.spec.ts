import { NotFoundException } from '@nestjs/common';
import { ListSchoolParentsUseCase } from './list-school-parents.use-case';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { School } from '../entities/school.entity';
import { Parent } from '../entities/parent.entity';

describe('ListSchoolParentsUseCase', () => {
  let useCase: ListSchoolParentsUseCase;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;

  const mockSchool: School = {
    id: 'school-1',
    name: 'Springfield Elementary',
    lat: -23.55052,
    lng: -46.633308,
    geofenceRadiusMeters: 500,
    notificationThresholdMeters: 1000,
    inviteCode: 'AB3X7Y2Z',
    createdAt: new Date(),
  };

  const mockParents: Parent[] = [
    {
      id: 'parent-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '11999999999',
      schoolId: 'school-1',
      createdAt: new Date(),
    },
    {
      id: 'parent-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '11988888888',
      schoolId: 'school-1',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    schoolRepositoryMock = {
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    };

    parentRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySchoolId: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validateCredentials: jest.fn(),
    };

    useCase = new ListSchoolParentsUseCase(
      schoolRepositoryMock,
      parentRepositoryMock,
    );
  });

  it('should return parents for a valid school', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    parentRepositoryMock.findBySchoolId.mockResolvedValue(mockParents);

    const result = await useCase.execute('school-1');

    expect(result.parents).toHaveLength(2);
    expect(result.parents[0].name).toBe('John Doe');
    expect(result.parents[1].name).toBe('Jane Smith');
    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-1');
    expect(parentRepositoryMock.findBySchoolId).toHaveBeenCalledWith('school-1');
  });

  it('should return empty array when no parents registered', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    parentRepositoryMock.findBySchoolId.mockResolvedValue([]);

    const result = await useCase.execute('school-1');

    expect(result.parents).toHaveLength(0);
  });

  it('should throw NotFoundException when school does not exist', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow(NotFoundException);
    expect(parentRepositoryMock.findBySchoolId).not.toHaveBeenCalled();
  });
});
