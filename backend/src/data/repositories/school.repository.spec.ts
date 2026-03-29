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
          },
        },
      ],
    }).compile();

    repository = module.get<SchoolRepository>(SchoolRepository);
    schoolRepositoryMock = module.get<Repository<SchoolModel>>(
      getRepositoryToken(SchoolModel),
    );
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
        inviteCode: 'AB3X7Y2Z',
        createdAt: new Date(),
      };

      const expectedEntity: School = {
        id: existingId,
        name: 'Test School',
        lat: 40.7128,
        lng: -74.006,
        geofenceRadiusMeters: 1000,
        notificationThresholdMeters: 500,
        inviteCode: 'AB3X7Y2Z',
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
        inviteCode: 'AB3X7Y2Z',
      };

      const mockSavedModel: SchoolModel = {
        id: 'new-id',
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        location: 'POINT(-118.2437 34.0522)',
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
        inviteCode: 'AB3X7Y2Z',
        createdAt: new Date(),
      };

      const expectedEntity: School = {
        id: 'new-id',
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
        inviteCode: 'AB3X7Y2Z',
        createdAt: mockSavedModel.createdAt,
      };

      const mockModelData = {
        name: 'New School',
        lat: 34.0522,
        lng: -118.2437,
        location: 'POINT(-118.2437 34.0522)',
        geofenceRadiusMeters: 800,
        notificationThresholdMeters: 400,
        inviteCode: 'AB3X7Y2Z',
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
});
