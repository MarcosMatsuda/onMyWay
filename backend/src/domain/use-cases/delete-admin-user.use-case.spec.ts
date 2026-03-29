import { NotFoundException } from '@nestjs/common';
import { DeleteAdminUserUseCase } from './delete-admin-user.use-case';
import { IUserRepository } from '../repositories/user.repository.interface';
import { User } from '../entities/user.entity';

describe('DeleteAdminUserUseCase', () => {
  let useCase: DeleteAdminUserUseCase;
  let userRepositoryMock: jest.Mocked<IUserRepository>;

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

    useCase = new DeleteAdminUserUseCase(userRepositoryMock);
  });

  it('should delete user successfully', async () => {
    userRepositoryMock.findById.mockResolvedValue(mockUser);
    userRepositoryMock.delete.mockResolvedValue(undefined);

    await useCase.execute('user-456');

    expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-456');
    expect(userRepositoryMock.delete).toHaveBeenCalledWith('user-456');
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepositoryMock.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-user')).rejects.toThrow(
      NotFoundException,
    );

    expect(userRepositoryMock.delete).not.toHaveBeenCalled();
  });
});
