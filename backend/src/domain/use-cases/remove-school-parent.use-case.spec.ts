import { NotFoundException } from '@nestjs/common';
import { RemoveSchoolParentUseCase } from './remove-school-parent.use-case';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';
import { Parent } from '../entities/parent.entity';

describe('RemoveSchoolParentUseCase', () => {
  let useCase: RemoveSchoolParentUseCase;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;
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

  const mockParent: Parent = {
    id: 'parent-456',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+5511999999999',
    schoolId: 'school-123',
    createdAt: new Date(),
  };

  beforeEach(() => {
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

    schoolRepositoryMock = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findParentsWithinGeofence: jest.fn(),
    } as any;

    useCase = new RemoveSchoolParentUseCase(
      parentRepositoryMock,
      schoolRepositoryMock,
    );
  });

  it('should remove parent from school successfully', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    parentRepositoryMock.findById.mockResolvedValue(mockParent);
    parentRepositoryMock.delete.mockResolvedValue(undefined);

    await useCase.execute('school-123', 'parent-456');

    expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-123');
    expect(parentRepositoryMock.findById).toHaveBeenCalledWith('parent-456');
    expect(parentRepositoryMock.delete).toHaveBeenCalledWith('parent-456');
  });

  it('should throw NotFoundException when school does not exist', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('non-existent-school', 'parent-456'),
    ).rejects.toThrow(NotFoundException);

    expect(parentRepositoryMock.findById).not.toHaveBeenCalled();
    expect(parentRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when parent does not exist', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    parentRepositoryMock.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('school-123', 'non-existent-parent'),
    ).rejects.toThrow(NotFoundException);

    expect(parentRepositoryMock.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when parent belongs to a different school', async () => {
    schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
    parentRepositoryMock.findById.mockResolvedValue({
      ...mockParent,
      schoolId: 'other-school',
    });

    await expect(useCase.execute('school-123', 'parent-456')).rejects.toThrow(
      NotFoundException,
    );

    expect(parentRepositoryMock.delete).not.toHaveBeenCalled();
  });
});
