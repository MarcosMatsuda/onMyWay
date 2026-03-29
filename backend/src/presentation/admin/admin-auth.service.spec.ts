import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { USER_REPOSITORY } from '@domain/repositories';
import { User } from '@domain/entities';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let mockUserRepository: any;
  let mockJwtService: any;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Super Admin',
    email: 'admin@school.com',
    role: 'super_admin',
    schoolId: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockUserRepository = {
      validateCredentials: jest.fn(),
      findById: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn((payload, options) => {
        if (options?.expiresIn === '15m') {
          return 'access_token';
        }
        return 'refresh_token';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AdminAuthService>(AdminAuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      const loginDto: AdminLoginDto = {
        email: 'admin@school.com',
        password: 'password123',
      };

      mockUserRepository.validateCredentials.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
      expect(result.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        schoolId: mockUser.schoolId,
        createdAt: mockUser.createdAt,
      });
      expect(mockUserRepository.validateCredentials).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto: AdminLoginDto = {
        email: 'admin@school.com',
        password: 'wrongpassword',
      };

      mockUserRepository.validateCredentials.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.validateCredentials).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });

    it('should sign JWT with correct payload including role', async () => {
      const loginDto: AdminLoginDto = {
        email: 'admin@school.com',
        password: 'password123',
      };

      mockUserRepository.validateCredentials.mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          schoolId: mockUser.schoolId,
        },
        { expiresIn: '15m' },
      );
      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          schoolId: mockUser.schoolId,
        },
        { expiresIn: '7d' },
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getProfile(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('invalid-id')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith('invalid-id');
    });
  });
});
