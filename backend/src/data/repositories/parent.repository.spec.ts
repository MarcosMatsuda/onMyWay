import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentRepository } from './parent.repository';
import { ParentModel } from '../models/parent.model';
import { ParentMapper } from '../mappers/parent.mapper';
import { Parent } from '../../domain/entities/parent.entity';

describe('ParentRepository', () => {
  let repository: ParentRepository;
  let parentRepositoryMock: Repository<ParentModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentRepository,
        {
          provide: getRepositoryToken(ParentModel),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<ParentRepository>(ParentRepository);
    parentRepositoryMock = module.get<Repository<ParentModel>>(
      getRepositoryToken(ParentModel),
    );
  });

  describe('findById', () => {
    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id';
      jest.spyOn(parentRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
      expect(parentRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });

    it('should return entity for existing ID', async () => {
      const existingId = 'existing-id';
      const mockModel: ParentModel = {
        id: existingId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const expectedEntity: Parent = {
        id: existingId,
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        schoolId: 'school-id',
        createdAt: mockModel.createdAt,
      };

      jest.spyOn(parentRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(ParentMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findById(existingId);

      expect(result).toEqual(expectedEntity);
      expect(parentRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: existingId },
      });
      expect(ParentMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('create', () => {
    it('should persist and return new entity', async () => {
      const createData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      };

      const mockSavedModel: ParentModel = {
        id: 'new-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
      };

      const expectedEntity: Parent = {
        id: 'new-id',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
        schoolId: 'school-id',
        createdAt: mockSavedModel.createdAt,
      };

      const mockModelData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+0987654321',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      };

      jest.spyOn(ParentMapper, 'toPersistence').mockReturnValue(mockModelData);
      jest
        .spyOn(parentRepositoryMock, 'create')
        .mockReturnValue(mockSavedModel);
      jest
        .spyOn(parentRepositoryMock, 'save')
        .mockResolvedValue(mockSavedModel);
      jest.spyOn(ParentMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.create(createData);

      expect(result).toEqual(expectedEntity);
      expect(ParentMapper.toPersistence).toHaveBeenCalledWith(createData);
      expect(parentRepositoryMock.create).toHaveBeenCalledWith(mockModelData);
      expect(parentRepositoryMock.save).toHaveBeenCalledWith(mockSavedModel);
      expect(ParentMapper.toDomain).toHaveBeenCalledWith(mockSavedModel);
    });
  });
});
