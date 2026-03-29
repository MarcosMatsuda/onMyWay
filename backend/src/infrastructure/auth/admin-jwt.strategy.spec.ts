import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

describe('AdminJwtStrategy', () => {
  let strategy: AdminJwtStrategy;
  let userRepositoryMock: jest.Mocked<IUserRepository>;

  const mockUser: User = {
    id: 'user-123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'school_admin',
    schoolId: 'school-456',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    userRepositoryMock = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      validateCredentials: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    const configServiceMock = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminJwtStrategy,
        {
          provide: USER_REPOSITORY,
          useValue: userRepositoryMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    strategy = module.get<AdminJwtStrategy>(AdminJwtStrategy);
  });

  describe('validate', () => {
    it('should return user for valid admin token with school_admin role', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'admin@example.com',
        role: 'school_admin',
      };

      userRepositoryMock.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-123');
    });

    it('should return user for valid admin token with super_admin role', async () => {
      const superAdminUser: User = {
        ...mockUser,
        id: 'user-super',
        role: 'super_admin',
        schoolId: null,
      };

      const payload: JwtPayload = {
        sub: 'user-super',
        email: 'super@example.com',
        role: 'super_admin',
      };

      userRepositoryMock.findById.mockResolvedValue(superAdminUser);

      const result = await strategy.validate(payload);

      expect(result).toEqual(superAdminUser);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-super');
    });

    it('should throw UnauthorizedException when role is parent (cross-isolation)', async () => {
      const payload: JwtPayload = {
        sub: 'parent-123',
        email: 'parent@example.com',
        role: 'parent',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token for admin endpoint',
      );
      expect(userRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when role is undefined (cross-isolation)', async () => {
      const payload: JwtPayload = {
        sub: 'user-123',
        email: 'user@example.com',
        // role not set
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token for admin endpoint',
      );
      expect(userRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is not found in repository', async () => {
      const payload: JwtPayload = {
        sub: 'non-existent-user',
        email: 'ghost@example.com',
        role: 'school_admin',
      };

      userRepositoryMock.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );
      expect(userRepositoryMock.findById).toHaveBeenCalledWith(
        'non-existent-user',
      );
    });

    it('should not call userRepository when role is parent', async () => {
      const payload: JwtPayload = {
        sub: 'parent-123',
        email: 'parent@example.com',
        role: 'parent',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it('should not call userRepository when role is absent', async () => {
      const payload: JwtPayload = {
        sub: 'some-user',
        email: 'user@example.com',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepositoryMock.findById).not.toHaveBeenCalled();
    });
  });
});
