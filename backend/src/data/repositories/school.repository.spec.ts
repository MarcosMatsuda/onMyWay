import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolRepository } from './school.repository';
import { SchoolModel } from '../models/school.model';
import { SchoolMapper } from '../mappers/school.mapper';
import { School } from '../../domain/entities/school.entity';

describe('SchoolRepository', () => {
  let repository: SchoolRepository;
  let schoolRepositoryMock: Repository<SchoolModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolRepository,
        {
          provide: getRepositoryToken(SchoolModel),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<SchoolRepository>(SchoolRepository);
    schoolRepositoryMock = module.get<Repository<SchoolModel>>(
      getRepositoryToken(SchoolModel),
    );
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id';
      jest.spyOn(schoolRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
      expect(schoolRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });

    it('should return entity for existing ID', async () => {
      const existingId = 'existing-id';
      const mockModel: SchoolModel = {
        id: existingId,
        name: 'Test School',
        lat: 40.7128,
        lng: -74.006,
        location: 'POINT(-74.006 40.7128)',
        geofenceRadiusMeters: 1000,
        notificationThresholdMeters: 500,
        createdAt: new Date(),
      };

      const expectedEntity: School = {
        id: existingId,
        name: 'Test School',
        lat: 40.7128,
        lng: -74.006,
        geofenceRadiusMeters: 1000,
        notificationThresholdMeters: 500,
        createdAt: mockModel.createdAt,
      };

      jest.spyOn(schoolRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(SchoolMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findById(existingId);

      expect(result).toEqual(expectedEntity);
      expect(schoolRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: existingId },
      });
      expect(SchoolMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('create', () => {
    it('should persist and return new entity', async () => {
      const createData = {
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
      };

      const mockSavedModel: SchoolModel = {
        id: 'new-id',
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        location: 'POINT(-118.2437 34.0522)',
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
        createdAt: new Date(),
      };

      const expectedEntity: School = {
        id: 'new-id',
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
        createdAt: mockSavedModel.createdAt,
      };

      const mockModelData = {
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        location: 'POINT(-118.2437 34.0522)',
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
      };

      jest.spyOn(SchoolMapper, 'toPersistence').mockReturnValue(mockModelData);
      jest
        .spyOn(schoolRepositoryMock, 'create')
        .mockReturnValue(mockSavedModel);
      jest
        .spyOn(schoolRepositoryMock, 'save')
        .mockResolvedValue(mockSavedModel);
      jest.spyOn(SchoolMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.create(createData);

      expect(result).toEqual(expectedEntity);
      expect(SchoolMapper.toPersistence).toHaveBeenCalledWith(createData);
      expect(schoolRepositoryMock.create).toHaveBeenCalledWith(mockModelData);
      expect(schoolRepositoryMock.save).toHaveBeenCalledWith(mockSavedModel);
      expect(SchoolMapper.toDomain).toHaveBeenCalledWith(mockSavedModel);
    });
  });

  describe('findAll', () => {
    it('should return all schools', async () => {
      const mockModels: SchoolModel[] = [
        {
          id: 'school-1',
          name: 'School One',
          lat: 40.7128,
          lng: -74.006,
          location: 'POINT(-74.006 40.7128)',
          geofenceRadiusMeters: 1000,
          notificationThresholdMeters: 500,
          createdAt: new Date(),
        },
        {
          id: 'school-2',
          name: 'School Two',
          lat: 34.0522,
          lng: -118.2437,
          location: 'POINT(-118.2437 34.0522)',
          geofenceRadiusMeters: 800,
          notificationThresholdMeters: 400,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(schoolRepositoryMock, 'find').mockResolvedValue(mockModels);
      jest.spyOn(SchoolMapper, 'toDomain').mockImplementation((model) => ({
        id: model.id,
        name: model.name,
        lat: model.lat,
        lng: model.lng,
        geofenceRadiusMeters: model.geofenceRadiusMeters,
        notificationThresholdMeters: model.notificationThresholdMeters,
        createdAt: model.createdAt,
      }));

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('school-1');
      expect(result[1].id).toBe('school-2');
      expect(schoolRepositoryMock.find).toHaveBeenCalled();
    });

    it('should return empty array when no schools exist', async () => {
      jest.spyOn(schoolRepositoryMock, 'find').mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should map all models to domain entities', async () => {
      const mockModels: SchoolModel[] = [
        {
          id: 'school-1',
          name: 'School One',
          lat: 40.7128,
          lng: -74.006,
          location: 'POINT(-74.006 40.7128)',
          geofenceRadiusMeters: 1000,
          notificationThresholdMeters: 500,
          createdAt: new Date(),
        },
      ];

      jest.spyOn(schoolRepositoryMock, 'find').mockResolvedValue(mockModels);
      jest.spyOn(SchoolMapper, 'toDomain').mockReturnValue({
        id: 'school-1',
        name: 'School One',
        lat: 40.7128,
        lng: -74.006,
        geofenceRadiusMeters: 1000,
        notificationThresholdMeters: 500,
        createdAt: mockModels[0].createdAt,
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('school-1');
    });
  });

  describe('update', () => {
    it('should update and return updated entity', async () => {
      const schoolId = 'school-1';
      const updateData: Partial<School> = {
        name: 'Updated School Name',
        geofenceRadiusMeters: 1200,
      };

      const updatedModel: SchoolModel = {
        id: schoolId,
        name: 'Updated School Name',
        lat: 40.7128,
        lng: -74.006,
        location: 'POINT(-74.006 40.7128)',
        geofenceRadiusMeters: 1200,
        notificationThresholdMeters: 500,
        createdAt: new Date(),
      };

      const expectedEntity: School = {
        id: schoolId,
        name: 'Updated School Name',
        lat: 40.7128,
        lng: -74.006,
        geofenceRadiusMeters: 1200,
        notificationThresholdMeters: 500,
        createdAt: updatedModel.createdAt,
      };

      jest.spyOn(schoolRepositoryMock, 'update').mockResolvedValue(undefined);
      jest
        .spyOn(schoolRepositoryMock, 'findOne')
        .mockResolvedValue(updatedModel);
      jest.spyOn(SchoolMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.update(schoolId, updateData);

      expect(result).toEqual(expectedEntity);
      expect(schoolRepositoryMock.update).toHaveBeenCalledWith(
        schoolId,
        updateData,
      );
      expect(schoolRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: schoolId },
      });
    });

    it('should throw error when school not found after update', async () => {
      const schoolId = 'non-existent-school';
      const updateData: Partial<School> = {
        name: 'New Name',
      };

      jest.spyOn(schoolRepositoryMock, 'update').mockResolvedValue(undefined);
      jest.spyOn(schoolRepositoryMock, 'findOne').mockResolvedValue(null);

      await expect(repository.update(schoolId, updateData)).rejects.toThrow(
        `School with id ${schoolId} not found after update`,
      );
    });

    it('should partially update school fields', async () => {
      const schoolId = 'school-1';
      const updateData: Partial<School> = {
        geofenceRadiusMeters: 500,
      };

      const updatedModel: SchoolModel = {
        id: schoolId,
        name: 'Original Name',
        lat: 40.7128,
        lng: -74.006,
        location: 'POINT(-74.006 40.7128)',
        geofenceRadiusMeters: 500,
        notificationThresholdMeters: 500,
        createdAt: new Date(),
      };

      jest.spyOn(schoolRepositoryMock, 'update').mockResolvedValue(undefined);
      jest
        .spyOn(schoolRepositoryMock, 'findOne')
        .mockResolvedValue(updatedModel);
      jest.spyOn(SchoolMapper, 'toDomain').mockReturnValue({
        id: schoolId,
        name: 'Original Name',
        lat: 40.7128,
        lng: -74.006,
        geofenceRadiusMeters: 500,
        notificationThresholdMeters: 500,
        createdAt: updatedModel.createdAt,
      });

      await repository.update(schoolId, updateData);

      expect(schoolRepositoryMock.update).toHaveBeenCalledWith(
        schoolId,
        updateData,
      );
    });
  });

  describe('delete', () => {
    it('should delete school by ID', async () => {
      const schoolId = 'school-1';

      jest.spyOn(schoolRepositoryMock, 'delete').mockResolvedValue(undefined);

      await repository.delete(schoolId);

      expect(schoolRepositoryMock.delete).toHaveBeenCalledWith(schoolId);
    });

    it('should handle deletion of non-existent school', async () => {
      const nonExistentId = 'non-existent-school';

      jest.spyOn(schoolRepositoryMock, 'delete').mockResolvedValue(undefined);

      await repository.delete(nonExistentId);

      expect(schoolRepositoryMock.delete).toHaveBeenCalledWith(nonExistentId);
    });

    it('should execute delete without side effects', async () => {
      const schoolId = 'school-to-delete';

      jest.spyOn(schoolRepositoryMock, 'delete').mockResolvedValue(undefined);

      const result = await repository.delete(schoolId);

      expect(result).toBeUndefined();
      expect(schoolRepositoryMock.delete).toHaveBeenCalledTimes(1);
    });
  });
});
