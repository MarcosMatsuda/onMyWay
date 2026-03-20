import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationRepository } from './location.repository';
import { LocationModel } from '../models/location.model';
import { LocationMapper } from '../mappers/location.mapper';
import { Location } from '../../domain/entities/location.entity';

describe('LocationRepository', () => {
  let repository: LocationRepository;
  let locationRepositoryMock: Repository<LocationModel>;

  const mockLocationModel: LocationModel = {
    id: 'location-123',
    parentId: 'parent-123',
    lat: -23.5505,
    lng: -46.6333,
    point: 'POINT(-46.6333 -23.5505)',
    accuracy: 10,
    timestamp: new Date(),
  };

  const mockLocationEntity: Location = {
    id: 'location-123',
    parentId: 'parent-123',
    lat: -23.5505,
    lng: -46.6333,
    accuracy: 10,
    timestamp: mockLocationModel.timestamp,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationRepository,
        {
          provide: getRepositoryToken(LocationModel),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<LocationRepository>(LocationRepository);
    locationRepositoryMock = module.get<Repository<LocationModel>>(
      getRepositoryToken(LocationModel),
    );
  });

  describe('save', () => {
    it('should persist and return location entity', async () => {
      const locationData: Omit<Location, 'id'> = {
        parentId: 'parent-123',
        lat: -23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: new Date(),
      };

      jest.spyOn(LocationMapper, 'toPersistence').mockReturnValue({
        parentId: 'parent-123',
        lat: -23.5505,
        lng: -46.6333,
        point: 'POINT(-46.6333 -23.5505)',
        accuracy: 10,
        timestamp: locationData.timestamp,
      });

      jest
        .spyOn(locationRepositoryMock, 'create')
        .mockReturnValue(mockLocationModel);
      jest
        .spyOn(locationRepositoryMock, 'save')
        .mockResolvedValue(mockLocationModel);
      jest
        .spyOn(LocationMapper, 'toDomain')
        .mockReturnValue(mockLocationEntity);

      const result = await repository.save(locationData);

      expect(result).toEqual(mockLocationEntity);
      expect(locationRepositoryMock.create).toHaveBeenCalled();
      expect(locationRepositoryMock.save).toHaveBeenCalledWith(
        mockLocationModel,
      );
      expect(LocationMapper.toDomain).toHaveBeenCalledWith(mockLocationModel);
    });

    it('should correctly map location to persistence format with POINT', async () => {
      const locationData: Omit<Location, 'id'> = {
        parentId: 'parent-456',
        lat: 40.7128,
        lng: -74.006,
        accuracy: 5,
        timestamp: new Date(),
      };

      const persistenceData = {
        parentId: 'parent-456',
        lat: 40.7128,
        lng: -74.006,
        point: 'POINT(-74.006 40.7128)',
        accuracy: 5,
        timestamp: locationData.timestamp,
      };

      jest
        .spyOn(LocationMapper, 'toPersistence')
        .mockReturnValue(persistenceData);

      jest.spyOn(locationRepositoryMock, 'create').mockReturnValue({
        ...mockLocationModel,
        parentId: 'parent-456',
        lat: 40.7128,
        lng: -74.006,
        point: 'POINT(-74.006 40.7128)',
      });

      jest.spyOn(locationRepositoryMock, 'save').mockResolvedValue({
        ...mockLocationModel,
        parentId: 'parent-456',
        lat: 40.7128,
        lng: -74.006,
        point: 'POINT(-74.006 40.7128)',
      });

      jest.spyOn(LocationMapper, 'toDomain').mockReturnValue({
        ...mockLocationEntity,
        parentId: 'parent-456',
        lat: 40.7128,
        lng: -74.006,
      });

      const result = await repository.save(locationData);

      expect(LocationMapper.toPersistence).toHaveBeenCalledWith(locationData);
      expect(result.lat).toBe(40.7128);
      expect(result.lng).toBe(-74.006);
    });
  });

  describe('findLatestByParentId', () => {
    it('should return latest location for parent', async () => {
      const parentId = 'parent-123';

      jest
        .spyOn(locationRepositoryMock, 'findOne')
        .mockResolvedValue(mockLocationModel);
      jest
        .spyOn(LocationMapper, 'toDomain')
        .mockReturnValue(mockLocationEntity);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toEqual(mockLocationEntity);
      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
      expect(LocationMapper.toDomain).toHaveBeenCalledWith(mockLocationModel);
    });

    it('should return null when no location found', async () => {
      const parentId = 'non-existent-parent';

      jest.spyOn(locationRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toBeNull();
      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
    });

    it('should order by timestamp DESC to get latest', async () => {
      const parentId = 'parent-456';
      const oldLocation: LocationModel = {
        ...mockLocationModel,
        parentId,
        timestamp: new Date('2024-01-01'),
      };

      jest
        .spyOn(locationRepositoryMock, 'findOne')
        .mockResolvedValue(oldLocation);
      jest.spyOn(LocationMapper, 'toDomain').mockReturnValue({
        ...mockLocationEntity,
        parentId,
        timestamp: oldLocation.timestamp,
      });

      await repository.findLatestByParentId(parentId);

      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('findParentsNearSchool', () => {
    it('should return parent IDs within radius using PostGIS ST_DWithin', async () => {
      const schoolId = 'school-456';
      const radiusMeters = 1000;

      const mockSchoolQuery = [{ location: 'POINT(-46.6333 -23.5505)' }];
      const mockParentsResult = [
        { parent_id: 'parent-1' },
        { parent_id: 'parent-2' },
        { parent_id: 'parent-3' },
      ];

      // Mock school location query
      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(mockSchoolQuery);

      // Mock parents near school query
      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(mockParentsResult);

      const result = await repository.findParentsNearSchool(
        schoolId,
        radiusMeters,
      );

      expect(result).toEqual(['parent-1', 'parent-2', 'parent-3']);
      expect(locationRepositoryMock.query).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when school not found', async () => {
      const schoolId = 'non-existent-school';
      const radiusMeters = 1000;

      jest.spyOn(locationRepositoryMock, 'query').mockResolvedValueOnce([]);

      const result = await repository.findParentsNearSchool(
        schoolId,
        radiusMeters,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array when school has no location', async () => {
      const schoolId = 'school-no-location';
      const radiusMeters = 1000;

      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce([{ location: null }]);

      const result = await repository.findParentsNearSchool(
        schoolId,
        radiusMeters,
      );

      expect(result).toEqual([]);
    });

    it('should limit results to 100 parents', async () => {
      const schoolId = 'school-456';
      const radiusMeters = 5000;

      const mockSchoolQuery = [{ location: 'POINT(-46.6333 -23.5505)' }];
      const manyParents = Array.from({ length: 100 }, (_, i) => ({
        parent_id: `parent-${i}`,
      }));

      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(mockSchoolQuery);
      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(manyParents);

      const result = await repository.findParentsNearSchool(
        schoolId,
        radiusMeters,
      );

      expect(result).toHaveLength(100);
    });

    it('should use ST_DWithin for geographic distance calculation', async () => {
      const schoolId = 'school-456';
      const radiusMeters = 500;

      const mockSchoolQuery = [{ location: 'POINT(-46.6333 -23.5505)' }];
      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(mockSchoolQuery);

      jest.spyOn(locationRepositoryMock, 'query').mockResolvedValueOnce([]);

      await repository.findParentsNearSchool(schoolId, radiusMeters);

      const queryCall = (locationRepositoryMock.query as jest.Mock).mock
        .calls[1];
      expect(queryCall[0]).toContain('ST_DWithin');
      expect(queryCall[1]).toEqual([mockSchoolQuery[0].location, radiusMeters]);
    });

    it('should order results by timestamp DESC', async () => {
      const schoolId = 'school-456';
      const radiusMeters = 1000;

      const mockSchoolQuery = [{ location: 'POINT(-46.6333 -23.5505)' }];
      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(mockSchoolQuery);

      jest.spyOn(locationRepositoryMock, 'query').mockResolvedValueOnce([]);

      await repository.findParentsNearSchool(schoolId, radiusMeters);

      const queryCall = (locationRepositoryMock.query as jest.Mock).mock
        .calls[1];
      expect(queryCall[0]).toContain('ORDER BY ll.timestamp DESC');
    });

    it('should filter to latest location per parent using DISTINCT ON', async () => {
      const schoolId = 'school-456';
      const radiusMeters = 1000;

      const mockSchoolQuery = [{ location: 'POINT(-46.6333 -23.5505)' }];
      jest
        .spyOn(locationRepositoryMock, 'query')
        .mockResolvedValueOnce(mockSchoolQuery);

      jest.spyOn(locationRepositoryMock, 'query').mockResolvedValueOnce([]);

      await repository.findParentsNearSchool(schoolId, radiusMeters);

      const queryCall = (locationRepositoryMock.query as jest.Mock).mock
        .calls[1];
      expect(queryCall[0]).toContain('DISTINCT ON (parent_id)');
    });
  });
});
