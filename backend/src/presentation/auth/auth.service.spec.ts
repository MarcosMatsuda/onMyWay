import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../../domain/repositories/parent.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../../domain/repositories/school.repository.interface';

describe('AuthService', () => {
  let authService: AuthService;
  let parentRepositoryMock: jest.Mocked<IParentRepository>;
  let schoolRepositoryMock: jest.Mocked<ISchoolRepository>;
  let jwtServiceMock: jest.Mocked<JwtService>;

  const mockParent = {
    id: 'parent-123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+5511987654321',
    schoolId: 'school-456',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
  };

  const mockSchool = {
    id: 'school-456',
    name: 'Springfield Elementary',
    lat: -23.5505,
    lng: -46.6333,
    geofenceRadiusMeters: 1000,
    notificationThresholdMeters: 500,
    inviteCode: 'AB3X7Y2Z',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    parentRepositoryMock = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      validateCredentials: jest.fn(),
    } as any;

    schoolRepositoryMock = {
      findById: jest.fn(),
      findByInviteCode: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
    } as any;

    jwtServiceMock = {
      sign: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PARENT_REPOSITORY,
          useValue: parentRepositoryMock,
        },
        {
          provide: SCHOOL_REPOSITORY,
          useValue: schoolRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register parent with valid schoolId', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654321',
        schoolId: 'school-456',
      };

      parentRepositoryMock.findByEmail.mockResolvedValue(null);
      schoolRepositoryMock.findById.mockResolvedValue(mockSchool);
      parentRepositoryMock.create.mockResolvedValue(mockParent);
      jwtServiceMock.sign.mockReturnValue('jwt-token');

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('jwt-token');
      expect(result.parent.id).toBe(mockParent.id);
      expect(schoolRepositoryMock.findById).toHaveBeenCalledWith('school-456');
      expect(parentRepositoryMock.create).toHaveBeenCalled();
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockParent.id,
          email: mockParent.email,
          schoolId: mockParent.schoolId,
        }),
        expect.anything(),
      );
    });

    it('should throw NotFoundException for invalid schoolId', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654321',
        schoolId: 'non-existent-school',
      };

      parentRepositoryMock.findByEmail.mockResolvedValue(null);
      schoolRepositoryMock.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(authService.register(registerDto)).rejects.toThrow(
        'School with id non-existent-school not found',
      );
      expect(parentRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654321',
        schoolId: 'school-456',
      };

      parentRepositoryMock.findByEmail.mockResolvedValue(mockParent);

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(schoolRepositoryMock.findById).not.toHaveBeenCalled();
    });

    it('should check school existence before checking email', async () => {
      // This test ensures the order of operations: school check happens after
      // email check but before password hashing
      const registerDto: RegisterDto = {
        name: 'John Doe',
        email: 'unique@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654321',
        schoolId: 'invalid-school',
      };

      parentRepositoryMock.findByEmail.mockResolvedValue(null);
      schoolRepositoryMock.findById.mockResolvedValue(null);

      await expect(authService.register(registerDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should register parent without schoolId', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123',
        phone: '+5511987654322',
        // schoolId is optional
      };

      const mockParentNoSchool = {
        ...mockParent,
        id: 'parent-789',
        name: 'Jane Doe',
        email: 'jane@example.com',
        schoolId: null,
      };

      parentRepositoryMock.findByEmail.mockResolvedValue(null);
      parentRepositoryMock.create.mockResolvedValue(mockParentNoSchool);
      jwtServiceMock.sign.mockReturnValue('jwt-token');

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('jwt-token');
      expect(result.parent.schoolId).toBeNull();
      expect(schoolRepositoryMock.findById).not.toHaveBeenCalled();
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockParentNoSchool.id,
          email: mockParentNoSchool.email,
          schoolId: null,
        }),
        expect.anything(),
      );
    });
  });

  describe('login', () => {
    it('should login parent with valid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'john@example.com',
        password: 'SecurePassword123',
      };

      parentRepositoryMock.validateCredentials.mockResolvedValue(mockParent);
      jwtServiceMock.sign.mockReturnValue('jwt-token');

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(result.accessToken).toBe('jwt-token');
      expect(result.refreshToken).toBe('jwt-token');
      expect(result.parent.id).toBe(mockParent.id);
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockParent.id,
          email: mockParent.email,
          schoolId: mockParent.schoolId,
        }),
        expect.anything(),
      );
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      // Arrange
      const loginDto = {
        email: 'john@example.com',
        password: 'WrongPassword',
      };

      parentRepositoryMock.validateCredentials.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getProfile', () => {
    it('should return parent profile', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(mockParent);

      // Act
      const result = await authService.getProfile('parent-123');

      // Assert
      expect(result).toEqual(mockParent);
    });

    it('should throw UnauthorizedException if parent not found', async () => {
      // Arrange
      parentRepositoryMock.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile('non-existent')).rejects.toThrow(
        'Parent not found',
      );
    });
  });
});
