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

  const mockETAModel: ETAModel = {
    id: 'eta-123',
    parentId: 'parent-123',
    schoolId: 'school-456',
    distanceMeters: 1500,
    durationSeconds: 300,
    routePolyline: 'polyline-string',
    calculatedAt: new Date(),
  };

  const mockETAEntity: ETA = {
    id: 'eta-123',
    parentId: 'parent-123',
    schoolId: 'school-456',
    distanceMeters: 1500,
    durationSeconds: 300,
    routePolyline: 'polyline-string',
    calculatedAt: mockETAModel.calculatedAt,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ETARepository,
        {
          provide: getRepositoryToken(ETAModel),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
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
    it('should persist and return ETA entity', async () => {
      const etaData: Omit<ETA, 'id'> = {
        parentId: 'parent-123',
        schoolId: 'school-456',
        distanceMeters: 1500,
        durationSeconds: 300,
        routePolyline: 'polyline-string',
        calculatedAt: new Date(),
      };

      jest.spyOn(ETAMapper, 'toPersistence').mockReturnValue({
        parentId: 'parent-123',
        schoolId: 'school-456',
        distanceMeters: 1500,
        durationSeconds: 300,
        routePolyline: 'polyline-string',
        calculatedAt: etaData.calculatedAt,
      });

      jest.spyOn(etaRepositoryMock, 'create').mockReturnValue(mockETAModel);
      jest.spyOn(etaRepositoryMock, 'save').mockResolvedValue(mockETAModel);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(mockETAEntity);

      const result = await repository.save(etaData);

      expect(result).toEqual(mockETAEntity);
      expect(etaRepositoryMock.create).toHaveBeenCalled();
      expect(etaRepositoryMock.save).toHaveBeenCalledWith(mockETAModel);
      expect(ETAMapper.toDomain).toHaveBeenCalledWith(mockETAModel);
    });

    it('should correctly convert ETA to persistence format', async () => {
      const etaData: Omit<ETA, 'id'> = {
        parentId: 'parent-456',
        schoolId: 'school-789',
        distanceMeters: 2500,
        durationSeconds: 600,
        routePolyline: 'another-polyline',
        calculatedAt: new Date(),
      };

      const persistenceData = {
        parentId: 'parent-456',
        schoolId: 'school-789',
        distanceMeters: 2500,
        durationSeconds: 600,
        routePolyline: 'another-polyline',
        calculatedAt: etaData.calculatedAt,
      };

      jest.spyOn(ETAMapper, 'toPersistence').mockReturnValue(persistenceData);

      jest.spyOn(etaRepositoryMock, 'create').mockReturnValue({
        ...mockETAModel,
        ...persistenceData,
        id: 'eta-456',
      });

      jest.spyOn(etaRepositoryMock, 'save').mockResolvedValue({
        ...mockETAModel,
        ...persistenceData,
        id: 'eta-456',
      });

      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue({
        ...mockETAEntity,
        ...etaData,
        id: 'eta-456',
      });

      const result = await repository.save(etaData);

      expect(ETAMapper.toPersistence).toHaveBeenCalledWith(etaData);
      expect(result.parentId).toBe('parent-456');
      expect(result.schoolId).toBe('school-789');
      expect(result.distanceMeters).toBe(2500);
      expect(result.durationSeconds).toBe(600);
    });
  });

  describe('findById', () => {
    it('should return ETA entity for existing ID', async () => {
      const etaId = 'eta-123';

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(mockETAModel);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(mockETAEntity);

      const result = await repository.findById(etaId);

      expect(result).toEqual(mockETAEntity);
      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: etaId },
      });
      expect(ETAMapper.toDomain).toHaveBeenCalledWith(mockETAModel);
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-eta';

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });

    it('should query by exact ID', async () => {
      const specificId = 'specific-eta-id';

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(null);

      await repository.findById(specificId);

      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: specificId },
      });
    });
  });

  describe('findLatestByParentId', () => {
    it('should return latest ETA for parent', async () => {
      const parentId = 'parent-123';

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(mockETAModel);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(mockETAEntity);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toEqual(mockETAEntity);
      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should return null when no ETA found for parent', async () => {
      const parentId = 'non-existent-parent';

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toBeNull();
      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should order by calculatedAt DESC to get latest', async () => {
      const parentId = 'parent-456';

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(mockETAModel);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue(mockETAEntity);

      await repository.findLatestByParentId(parentId);

      expect(etaRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should handle multiple ETAs for same parent by selecting newest', async () => {
      const parentId = 'parent-multi';
      const newestETA = {
        ...mockETAModel,
        parentId,
        calculatedAt: new Date('2024-01-15'),
      };

      jest.spyOn(etaRepositoryMock, 'findOne').mockResolvedValue(newestETA);
      jest.spyOn(ETAMapper, 'toDomain').mockReturnValue({
        ...mockETAEntity,
        parentId,
        calculatedAt: newestETA.calculatedAt,
      });

      const result = await repository.findLatestByParentId(parentId);

      expect(result?.calculatedAt).toEqual(newestETA.calculatedAt);
    });
  });

  describe('findBySchoolId', () => {
    it('should return all ETAs for school', async () => {
      const schoolId = 'school-456';
      const mockETAs: ETAModel[] = [
        mockETAModel,
        {
          ...mockETAModel,
          id: 'eta-124',
          parentId: 'parent-124',
          distanceMeters: 2000,
          durationSeconds: 400,
          calculatedAt: new Date(),
        },
      ];

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue(mockETAs);
      jest.spyOn(ETAMapper, 'toDomain').mockImplementation((model) => ({
        ...mockETAEntity,
        id: model.id,
        parentId: model.parentId,
        distanceMeters: model.distanceMeters,
        durationSeconds: model.durationSeconds,
        calculatedAt: model.calculatedAt,
      }));

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toHaveLength(2);
      expect(etaRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should return empty array when no ETAs for school', async () => {
      const schoolId = 'empty-school';

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue([]);

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toEqual([]);
      expect(etaRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should order by calculatedAt DESC to get newest first', async () => {
      const schoolId = 'school-456';

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue([]);

      await repository.findBySchoolId(schoolId);

      expect(etaRepositoryMock.find).toHaveBeenCalledWith({
        where: { schoolId },
        order: { calculatedAt: 'DESC' },
      });
    });

    it('should map all models to domain entities', async () => {
      const schoolId = 'school-multi';
      const mockETAs: ETAModel[] = [
        {
          ...mockETAModel,
          id: 'eta-1',
          parentId: 'parent-1',
          calculatedAt: new Date('2024-01-15'),
        },
        {
          ...mockETAModel,
          id: 'eta-2',
          parentId: 'parent-2',
          calculatedAt: new Date('2024-01-14'),
        },
        {
          ...mockETAModel,
          id: 'eta-3',
          parentId: 'parent-3',
          calculatedAt: new Date('2024-01-13'),
        },
      ];

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue(mockETAs);

      jest.spyOn(ETAMapper, 'toDomain').mockImplementation((model) => ({
        ...mockETAEntity,
        id: model.id,
        parentId: model.parentId,
        calculatedAt: model.calculatedAt,
      }));

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('eta-1');
      expect(result[1].id).toBe('eta-2');
      expect(result[2].id).toBe('eta-3');
    });

    it('should handle large result sets', async () => {
      const schoolId = 'school-large';
      const manyETAs = Array.from({ length: 50 }, (_, i) => ({
        ...mockETAModel,
        id: `eta-${i}`,
        parentId: `parent-${i}`,
        calculatedAt: new Date(Date.now() - i * 60000), // Each 1 minute older
      }));

      jest.spyOn(etaRepositoryMock, 'find').mockResolvedValue(manyETAs);
      jest.spyOn(ETAMapper, 'toDomain').mockImplementation((model) => ({
        ...mockETAEntity,
        id: model.id,
        parentId: model.parentId,
        calculatedAt: model.calculatedAt,
      }));

      const result = await repository.findBySchoolId(schoolId);

      expect(result).toHaveLength(50);
    });
  });
});
