import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LocationRepository } from './location.repository';
import { LocationModel } from '../models/location.model';
import { LocationMapper } from '../mappers/location.mapper';
import { Location } from '../../domain/entities/location.entity';

describe('LocationRepository', () => {
  let repository: LocationRepository;
  let locationRepositoryMock: Repository<LocationModel>;
  let dataSourceMock: DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationRepository,
        {
          provide: getRepositoryToken(LocationModel),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<LocationRepository>(LocationRepository);
    locationRepositoryMock = module.get<Repository<LocationModel>>(
      getRepositoryToken(LocationModel),
    );
    dataSourceMock = module.get<DataSource>(DataSource);
  });

  describe('save', () => {
    it('should persist and return location using raw SQL', async () => {
      const createData = {
        parentId: 'parent-1',
        lat: 23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: new Date(),
      };

      jest.spyOn(dataSourceMock, 'query').mockResolvedValue([]);

      const result = await repository.save(createData);

      expect(dataSourceMock.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO locations'),
        expect.arrayContaining([
          expect.any(String), // id (UUID)
          'parent-1',
          23.5505,
          -46.6333,
          10,
          createData.timestamp,
        ]),
      );
      expect(result).toMatchObject({
        parentId: 'parent-1',
        lat: 23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: createData.timestamp,
        id: expect.any(String),
      });
    });
  });

  describe('findById', () => {
    it('should return null for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id';
      jest.spyOn(locationRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: nonExistentId },
      });
    });

    it('should return location for existing ID', async () => {
      const existingId = 'location-1';
      const mockModel: LocationModel = {
        id: existingId,
        parentId: 'parent-1',
        lat: 23.5505,
        lng: -46.6333,
        point: 'POINT(-46.6333 23.5505)',
        accuracy: 10,
        timestamp: new Date('2026-03-21T10:00:00Z'),
      };

      const expectedEntity: Location = {
        id: existingId,
        parentId: 'parent-1',
        lat: 23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: mockModel.timestamp,
      };

      jest
        .spyOn(locationRepositoryMock, 'findOne')
        .mockResolvedValue(mockModel);
      jest.spyOn(LocationMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findById(existingId);

      expect(result).toEqual(expectedEntity);
      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: existingId },
      });
      expect(LocationMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });
  });

  describe('findLatestByParentId', () => {
    it('should return most recent location for parent', async () => {
      const parentId = 'parent-1';
      const now = new Date();
      const mockModel: LocationModel = {
        id: 'location-1',
        parentId,
        lat: 23.5505,
        lng: -46.6333,
        point: 'POINT(-46.6333 23.5505)',
        accuracy: 10,
        timestamp: now,
      };

      const expectedEntity: Location = {
        id: 'location-1',
        parentId,
        lat: 23.5505,
        lng: -46.6333,
        accuracy: 10,
        timestamp: now,
      };

      jest
        .spyOn(locationRepositoryMock, 'findOne')
        .mockResolvedValue(mockModel);
      jest.spyOn(LocationMapper, 'toDomain').mockReturnValue(expectedEntity);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toEqual(expectedEntity);
      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
      expect(LocationMapper.toDomain).toHaveBeenCalledWith(mockModel);
    });

    it('should return null when no location exists for parent', async () => {
      const parentId = 'parent-1';
      jest.spyOn(locationRepositoryMock, 'findOne').mockResolvedValue(null);

      const result = await repository.findLatestByParentId(parentId);

      expect(result).toBeNull();
      expect(locationRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('findByParentId', () => {
    it('should return locations ordered by timestamp DESC', async () => {
      const parentId = 'parent-1';
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);

      const mockModels: LocationModel[] = [
        {
          id: 'location-1',
          parentId,
          lat: 23.5505,
          lng: -46.6333,
          point: 'POINT(-46.6333 23.5505)',
          accuracy: 10,
          timestamp: now,
        },
        {
          id: 'location-2',
          parentId,
          lat: 23.55,
          lng: -46.633,
          point: 'POINT(-46.633 23.55)',
          accuracy: 15,
          timestamp: oneHourAgo,
        },
      ];

      const expectedEntities: Location[] = [
        {
          id: 'location-1',
          parentId,
          lat: 23.5505,
          lng: -46.6333,
          accuracy: 10,
          timestamp: now,
        },
        {
          id: 'location-2',
          parentId,
          lat: 23.55,
          lng: -46.633,
          accuracy: 15,
          timestamp: oneHourAgo,
        },
      ];

      jest.spyOn(locationRepositoryMock, 'find').mockResolvedValue(mockModels);
      jest
        .spyOn(LocationMapper, 'toDomain')
        .mockImplementation(
          (model) => expectedEntities.find((e) => e.id === model.id)!,
        );

      const result = await repository.findByParentId(parentId);

      expect(result).toEqual(expectedEntities);
      expect(locationRepositoryMock.find).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
    });

    it('should return empty array when parent has no locations', async () => {
      const parentId = 'parent-1';
      jest.spyOn(locationRepositoryMock, 'find').mockResolvedValue([]);

      const result = await repository.findByParentId(parentId);

      expect(result).toEqual([]);
      expect(locationRepositoryMock.find).toHaveBeenCalledWith({
        where: { parentId },
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('findParentsNearSchool', () => {
    it('should execute PostGIS query with correct parameter order (lng, lat)', async () => {
      const schoolId = 'school-1';
      const mockResult = [{ parent_id: 'parent-1' }, { parent_id: 'parent-2' }];

      jest.spyOn(dataSourceMock, 'query').mockResolvedValue(mockResult);

      const result = await repository.findParentsNearSchool(schoolId);

      expect(result).toEqual(['parent-1', 'parent-2']);
      expect(dataSourceMock.query).toHaveBeenCalledWith(expect.any(String), [
        schoolId,
      ]);

      // Verify the query contains correct coordinate order
      const callArgs = (dataSourceMock.query as jest.Mock).mock.calls[0];
      const sqlQuery = callArgs[0];
      expect(sqlQuery).toContain('ST_MakePoint(l.lng, l.lat)');
      expect(sqlQuery).toContain('ST_MakePoint(s.lng, s.lat)');
    });

    it('should return empty array when no parents are within geofence', async () => {
      const schoolId = 'school-1';
      jest.spyOn(dataSourceMock, 'query').mockResolvedValue([]);

      const result = await repository.findParentsNearSchool(schoolId);

      expect(result).toEqual([]);
      expect(dataSourceMock.query).toHaveBeenCalledWith(expect.any(String), [
        schoolId,
      ]);
    });

    it('should validate correct SQL parameter order for geofence filtering', async () => {
      const schoolId = 'school-1';
      jest.spyOn(dataSourceMock, 'query').mockResolvedValue([]);

      await repository.findParentsNearSchool(schoolId);

      const callArgs = (dataSourceMock.query as jest.Mock).mock.calls[0];
      const sqlQuery = callArgs[0];
      const parameters = callArgs[1];

      // Verify SQL has correct coordinate order (longitude, latitude)
      expect(sqlQuery).toContain('ST_MakePoint(l.lng, l.lat)::geography');
      expect(sqlQuery).toContain('ST_MakePoint(s.lng, s.lat)::geography');
      expect(sqlQuery).toContain('geofence_radius_meters');
      expect(sqlQuery).toContain('MAX(l2.timestamp)');

      // Verify parameters are passed correctly
      expect(parameters).toEqual([schoolId]);
    });
  });
});
