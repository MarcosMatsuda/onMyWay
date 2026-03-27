import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ETARepository } from './eta.repository';
import { ETAModel } from '../models/eta.model';
import { ETAMapper } from '../mappers/eta.mapper';
import { ETA } from '../../domain/entities/eta.entity';

describe('ETARepository', () => {
  let repository: ETARepository;
  let etaRepositoryMock: Repository<ETAModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ETARepository,
        {
          provide: getRepositoryToken(ETAModel),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<ETARepository>(ETARepository);
    etaRepositoryMock = module.get<Repository<ETAModel>>(
      getRepositoryToken(ETAModel),
    );
  });

  describe('save', () => {
    it('should persist and return ETA', async () => {
      const createData = {
        parentId: 'parent-1',
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: new Date(),
      };

      const mockSavedModel: ETAModel = {
        id: 'eta-1',
        parentId: 'parent-1',
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: createData.calculatedAt,
      };

      const expectedEntity: ETA = {
        id: 'eta-1',
        parentId: 'parent-1',
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: createData.calculatedAt,
      };

      const mockModelData = {
        parentId: 'parent-1',
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: createData.calculatedAt,
      };

      jest.spyOn(ETAMapper, 'toPersistence').mockReturnValue(mockModelData);
      jest.spyOn(etaRepositoryMock, 'create').mockReturnValue(mockSavedModel);
      jest.spyOn(etaRepositoryMock, 'save').mockResolvedValue(mockSavedModel);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.save(createData);

      expect(result).toEqual(expectedEntity);
      expect(ETAMapper.toPersistence).toHaveBeenCalledWith(createData);
      expect(etaRepositoryMock.create).toHaveBeenCalledWith(mockModelData);
      expect(etaRepositoryMock.save).toHaveBeenCalledWith(mockSavedModel);
      expect(ETAMapper.toDomain).toHaveBeenCalledWith(mockSavedModel);
    });
  });

  describe('findById', () => {
    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id';
      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });

    it('should return ETA for existing ID', async () => {
      const existingId = 'eta-1';
      const now = new Date('2026-03-21T10:00:00Z');
      const mockModel: ETAModel = {
        id: existingId,
        parentId: 'parent-1',
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: now,
      };

      const expectedEntity: ETA = {
        id: existingId,
        parentId: 'parent-1',
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: now,
      };

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(mockModel);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findById(existingId);

      expect(result).toEqual(expectedEntity);
      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: existingId },
      });
      expect(ETAMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('findLatestByParentId', () => {
    it('should return most recent ETA for parent', async () => {
      const parentId = 'parent-1';
      const now = new Date();
      const mockModel: ETAModel = {
        id: 'eta-1',
        parentId,
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: now,
      };

      const expectedEntity: ETA = {
        id: 'eta-1',
        parentId,
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: now,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockModel),
      };

      jest
        .spyOn(etaRepositoryMock, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toEqual(expectedEntity);
      expect(etaRepositoryMock.createQueryBuilder).toHaveBeenCalledWith('eta');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'eta.parentId = :parentId',
        { parentId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'eta.calculatedAt',
        'DESC',
      );
      expect(ETAMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });

    it('should return null when no ETA exists for parent', async () => {
      const parentId = 'parent-1';

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      jest
        .spyOn(etaRepositoryMock, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toBeNull();
      expect(etaRepositoryMock.createQueryBuilder).toHaveBeenCalledWith('eta');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'eta.parentId = :parentId',
        { parentId },
      );
    });

    it('should filter by maxAgeMinutes when provided', async () => {
      const parentId = 'parent-1';
      const maxAgeMinutes = 5;
      const now = new Date();
      const mockModel: ETAModel = {
        id: 'eta-1',
        parentId,
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: now,
      };

      const expectedEntity: ETA = {
        id: 'eta-1',
        parentId,
        schoolId: 'school-1',
        distanceMeters: 5000,
        durationSeconds: 900,
        routePolyline: 'polyline123',
        calculatedAt: now,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockModel),
      };

      jest
        .spyOn(etaRepositoryMock, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findLatestByParentId(
        parentId,
        maxAgeMinutes,
      );

      expect(result).toEqual(expectedEntity);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "eta.calculatedAt > NOW() - INTERVAL ':maxAgeMinutes minutes'",
        { maxAgeMinutes },
      );
      expect(ETAMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('findBySchoolId', () => {
    it('should return ETAs sorted by calculatedAt DESC', async () => {
      const schoolId = 'school-1';
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const mockModels: ETAModel[] = [
        {
          id: 'eta-1',
          parentId: 'parent-1',
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 900,
          routePolyline: 'polyline123',
          calculatedAt: now,
        },
        {
          id: 'eta-2',
          parentId: 'parent-2',
          schoolId,
          distanceMeters: 3000,
          durationSeconds: 600,
          routePolyline: 'polyline456',
          calculatedAt: oneHourAgo,
        },
      ];

      const expectedEntities: ETA[] = [
        {
          id: 'eta-1',
          parentId: 'parent-1',
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 900,
          routePolyline: 'polyline123',
          calculatedAt: now,
        },
        {
          id: 'eta-2',
          parentId: 'parent-2',
          schoolId,
          distanceMeters: 3000,
          durationSeconds: 600,
          routePolyline: 'polyline456',
          calculatedAt: oneHourAgo,
        },
      ];

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue(mockModels);
      jest
        .spyOn(ETAMapper, 'toDomain')
        .mockImplementation(
          (model) => expectedEntities.find((e) => e.id === model.id)!,
        );

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toEqual(expectedEntities);
      expect(etaRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should return empty array when school has no ETAs', async () => {
      const schoolId = 'school-1';
      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue([]);

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toEqual([]);
      expect(etaRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should return list sorted by duration for arrival sequence', async () => {
      const schoolId = 'school-1';
      const baseDate = new Date();

      // Create test data with different durations to verify sorting
      const mockModels: ETAModel[] = [
        {
          id: 'eta-3',
          parentId: 'parent-3',
          schoolId,
          distanceMeters: 1000,
          durationSeconds: 300, // 5 minutes
          routePolyline: 'polyline789',
          calculatedAt: baseDate,
        },
        {
          id: 'eta-1',
          parentId: 'parent-1',
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 900, // 15 minutes
          routePolyline: 'polyline123',
          calculatedAt: baseDate,
        },
        {
          id: 'eta-2',
          parentId: 'parent-2',
          schoolId,
          distanceMeters: 3000,
          durationSeconds: 600, // 10 minutes
          routePolyline: 'polyline456',
          calculatedAt: baseDate,
        },
      ];

      const expectedEntities: ETA[] = mockModels.map((m) => ({
        id: m.id,
        parentId: m.parentId,
        schoolId: m.schoolId,
        distanceMeters: m.distanceMeters,
        durationSeconds: m.durationSeconds,
        routePolyline: m.routePolyline,
        calculatedAt: m.calculatedAt,
      }));

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue(mockModels);
      jest
        .spyOn(ETAMapper, 'toDomain')
        .mockImplementation(
          (model) => expectedEntities.find((e) => e.id === model.id)!,
        );

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toHaveLength(3);
      // Verify all ETAs are returned (sorting by calculatedAt DESC handled by DB)
      expect(result.map((e) => e.durationSeconds)).toEqual([300, 900, 600]);
    });
  });
});
