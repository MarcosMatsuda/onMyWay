import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { UserModel } from '../models/user.model';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../../domain/entities/user.entity';

jest.mock('bcrypt');

describe('UserRepository', () => {
  let repository: UserRepository;
  let userRepositoryMock: Repository<UserModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(UserModel),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    userRepositoryMock = module.get<Repository<UserModel>>(
      getRepositoryToken(UserModel),
    );
  });

  describe('findById', () => {
    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id';
      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });

    it('should return entity for existing ID', async () => {
      const existingId = 'existing-id';
      const mockModel: UserModel = {
        id: existingId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const expectedEntity: User = {
        id: existingId,
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'school_admin',
        schoolId: 'school-id',
        createdAt: mockModel.createdAt,
      };

      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findById(existingId);

      expect(result).toEqual(expectedEntity);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: existingId },
      });
      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('findByEmail', () => {
    it('should return null for non-existent email', async () => {
      const email = 'nonexistent@example.com';
      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return entity for existing email', async () => {
      const email = 'admin@example.com';
      const mockModel: UserModel = {
        id: 'user-id',
        name: 'Admin User',
        email,
        role: 'super_admin',
        schoolId: null,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const expectedEntity: User = {
        id: 'user-id',
        name: 'Admin User',
        email,
        role: 'super_admin',
        schoolId: null,
        createdAt: mockModel.createdAt,
      };

      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findByEmail(email);

      expect(result).toEqual(expectedEntity);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('create', () => {
    it('should persist and return new entity', async () => {
      const createData = {
        name: 'New Admin',
        email: 'newadmin@example.com',
        role: 'school_admin' as const,
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      };

      const mockSavedModel: UserModel = {
        id: 'new-id',
        name: 'New Admin',
        email: 'newadmin@example.com',
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const expectedEntity: User = {
        id: 'new-id',
        name: 'New Admin',
        email: 'newadmin@example.com',
        role: 'school_admin',
        schoolId: 'school-id',
        createdAt: mockSavedModel.createdAt,
      };

      const mockModelData = {
        name: 'New Admin',
        email: 'newadmin@example.com',
        role: 'school_admin' as const,
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      };

      jest.spyOn(UserMapper, 'toPersistence').mockReturnValue(mockModelData);
      jest.spyOn(userRepositoryMock, 'create').mockReturnValue(mockSavedModel);
      jest.spyOn(userRepositoryMock, 'save').mockResolvedValue(mockSavedModel);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.create(createData);

      expect(result).toEqual(expectedEntity);
      expect(UserMapper.toPersistence).toHaveBeenCalledWith(createData);
      expect(userRepositoryMock.create).toHaveBeenCalledWith(mockModelData);
      expect(userRepositoryMock.save).toHaveBeenCalledWith(mockSavedModel);
      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockSavedModel);
    });
  });

  describe('validateCredentials', () => {
    it('should return null if email not found', async () => {
      const email = 'notfound@example.com';
      const password = 'password123';
      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.validateCredentials(email, password);

      expect(result).toBeNull();
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should return null if password is invalid', async () => {
      const email = 'admin@example.com';
      const password = 'wrongpassword';
      const mockModel: UserModel = {
        id: 'user-id',
        name: 'Admin User',
        email,
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await repository.validateCredentials(email, password);

      expect(result).toBeNull();
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
    });

    it('should return user entity if credentials are valid', async () => {
      const email = 'admin@example.com';
      const password = 'correctpassword';
      const mockModel: UserModel = {
        id: 'user-id',
        name: 'Admin User',
        email,
        role: 'super_admin',
        schoolId: null,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const expectedEntity: User = {
        id: 'user-id',
        name: 'Admin User',
        email,
        role: 'super_admin',
        schoolId: null,
        createdAt: mockModel.createdAt,
      };

      jest.spyOn(userRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.validateCredentials(email, password);

      expect(result).toEqual(expectedEntity);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed-password');
      expect(UserMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('findBySchoolId', () => {
    it('should return empty array when no users found for school', async () => {
      const schoolId = 'school-123';
      jest.spyOn(userRepositoryMock, 'find').mockResolvedValue([]);

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toEqual([]);
      expect(userRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
      });
    });

    it('should return mapped domain entities for existing school admins', async () => {
      const schoolId = 'school-123';
      const mockModels: UserModel[] = [
        {
          id: 'user-1',
          name: 'Admin One',
          email: 'admin1@school.com',
          role: 'school_admin',
          schoolId,
          passwordHash: 'hash1',
          createdAt: new Date(),
        },
        {
          id: 'user-2',
          name: 'Admin Two',
          email: 'admin2@school.com',
          role: 'school_admin',
          schoolId,
          passwordHash: 'hash2',
          createdAt: new Date(),
        },
      ];

      const expectedEntities: User[] = mockModels.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        schoolId: m.schoolId,
        createdAt: m.createdAt,
      }));

      jest.spyOn(userRepositoryMock, 'find').mockResolvedValue(mockModels);
      jest
        .spyOn(UserMapper, 'toDomain')
        .mockReturnValueOnce(expectedEntities[0])
        .mockReturnValueOnce(expectedEntities[1]);

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toEqual(expectedEntities);
      expect(userRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
      });
    });
  });

  describe('delete', () => {
    it('should call delete on the TypeORM repository', async () => {
      const userId = 'user-456';
      jest.spyOn(userRepositoryMock, 'delete').mockResolvedValue({
        affected: 1,
        raw: {},
      });

      await repository.delete(userId);

      expect(userRepositoryMock.delete).toHaveBeenCalledWith(userId);
    });
  });
});
