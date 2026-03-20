import {
  GetArrivalsQueueUseCase,
  GetArrivalsQueueInput,
} from './get-arrivals-queue.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { ETA } from '../entities/eta.entity';
import { Parent } from '../entities/parent.entity';
import { School } from '../entities/school.entity';

describe('GetArrivalsQueueUseCase', () => {
  let useCase: GetArrivalsQueueUseCase;
  let etaRepository: jest.Mocked<IETARepository>;
  let schoolRepository: jest.Mocked<ISchoolRepository>;
  let parentRepository: jest.Mocked<IParentRepository>;

  beforeEach(() => {
    etaRepository = {
      save: jest.fn(),
      findBySchoolId: jest.fn(),
      findLatestByParentId: jest.fn(),
    } as any;

    schoolRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    parentRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findBySchoolId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      validateCredentials: jest.fn(),
    } as any;

    useCase = new GetArrivalsQueueUseCase(
      etaRepository,
      schoolRepository,
      parentRepository,
    );
  });

  describe('execute', () => {
    describe('School Validation', () => {
      it('should throw error when school does not exist', async () => {
        const input: GetArrivalsQueueInput = {
          schoolId: 'non-existent-school',
        };

        schoolRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(
          'School with id non-existent-school not found',
        );
        expect(schoolRepository.findById).toHaveBeenCalledWith(
          'non-existent-school',
        );
        expect(etaRepository.findBySchoolId).not.toHaveBeenCalled();
      });
    });

    describe('Empty Queue', () => {
      it('should return empty arrivals when no ETAs exist for school', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([]);

        const result = await useCase.execute(input);

        expect(result.arrivals).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.schoolName).toBe('Lincoln High School');
      });
    });

    describe('Single Arrival', () => {
      it('should return single arrival with parent information', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 600,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(mockParent);

        const result = await useCase.execute(input);

        expect(result.arrivals).toHaveLength(1);
        expect(result.arrivals[0]).toEqual({
          parentId,
          parentName: 'John Doe',
          etaMinutes: 10,
          distanceMeters: 5000,
          calculatedAt: expect.any(Date),
        });
        expect(result.totalCount).toBe(1);
      });
    });

    describe('Sorting by ETA', () => {
      it('should sort arrivals by ETA ascending (soonest first)', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETAs: ETA[] = [
          {
            id: 'eta-1',
            parentId: 'parent-1',
            schoolId,
            distanceMeters: 50000,
            durationSeconds: 3600, // 60 minutes
            routePolyline: 'polyline1',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-2',
            parentId: 'parent-2',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 300, // 5 minutes
            routePolyline: 'polyline2',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-3',
            parentId: 'parent-3',
            schoolId,
            distanceMeters: 10000,
            durationSeconds: 900, // 15 minutes
            routePolyline: 'polyline3',
            calculatedAt: new Date(),
          },
        ];

        const mockParents: Record<string, Parent> = {
          'parent-1': {
            id: 'parent-1',
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+1111111111',
            schoolId,
            createdAt: new Date(),
          },
          'parent-2': {
            id: 'parent-2',
            name: 'Bob',
            email: 'bob@example.com',
            phone: '+2222222222',
            schoolId,
            createdAt: new Date(),
          },
          'parent-3': {
            id: 'parent-3',
            name: 'Charlie',
            email: 'charlie@example.com',
            phone: '+3333333333',
            schoolId,
            createdAt: new Date(),
          },
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue(mockETAs);
        parentRepository.findById.mockImplementation((parentId) =>
          Promise.resolve(mockParents[parentId]),
        );

        const result = await useCase.execute(input);

        expect(result.arrivals[0].parentName).toBe('Bob'); // 5 minutes
        expect(result.arrivals[0].etaMinutes).toBe(5);
        expect(result.arrivals[1].parentName).toBe('Charlie'); // 15 minutes
        expect(result.arrivals[1].etaMinutes).toBe(15);
        expect(result.arrivals[2].parentName).toBe('Alice'); // 60 minutes
        expect(result.arrivals[2].etaMinutes).toBe(60);
      });

      it('should handle arrivals with same ETA', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETAs: ETA[] = [
          {
            id: 'eta-1',
            parentId: 'parent-1',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 600,
            routePolyline: 'polyline1',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-2',
            parentId: 'parent-2',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 600,
            routePolyline: 'polyline2',
            calculatedAt: new Date(),
          },
        ];

        const mockParents: Record<string, Parent> = {
          'parent-1': {
            id: 'parent-1',
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+1111111111',
            schoolId,
            createdAt: new Date(),
          },
          'parent-2': {
            id: 'parent-2',
            name: 'Bob',
            email: 'bob@example.com',
            phone: '+2222222222',
            schoolId,
            createdAt: new Date(),
          },
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue(mockETAs);
        parentRepository.findById.mockImplementation((parentId) =>
          Promise.resolve(mockParents[parentId]),
        );

        const result = await useCase.execute(input);

        expect(result.arrivals).toHaveLength(2);
        expect(result.arrivals[0].etaMinutes).toBe(10);
        expect(result.arrivals[1].etaMinutes).toBe(10);
      });
    });

    describe('Limit Parameter', () => {
      it('should limit results when limit parameter is provided', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETAs: ETA[] = [
          {
            id: 'eta-1',
            parentId: 'parent-1',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 300,
            routePolyline: 'polyline1',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-2',
            parentId: 'parent-2',
            schoolId,
            distanceMeters: 10000,
            durationSeconds: 600,
            routePolyline: 'polyline2',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-3',
            parentId: 'parent-3',
            schoolId,
            distanceMeters: 15000,
            durationSeconds: 900,
            routePolyline: 'polyline3',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-4',
            parentId: 'parent-4',
            schoolId,
            distanceMeters: 20000,
            durationSeconds: 1200,
            routePolyline: 'polyline4',
            calculatedAt: new Date(),
          },
        ];

        const mockParents: Record<string, Parent> = {
          'parent-1': {
            id: 'parent-1',
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+1111111111',
            schoolId,
            createdAt: new Date(),
          },
          'parent-2': {
            id: 'parent-2',
            name: 'Bob',
            email: 'bob@example.com',
            phone: '+2222222222',
            schoolId,
            createdAt: new Date(),
          },
          'parent-3': {
            id: 'parent-3',
            name: 'Charlie',
            email: 'charlie@example.com',
            phone: '+3333333333',
            schoolId,
            createdAt: new Date(),
          },
          'parent-4': {
            id: 'parent-4',
            name: 'David',
            email: 'david@example.com',
            phone: '+4444444444',
            schoolId,
            createdAt: new Date(),
          },
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
          limit: 2,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue(mockETAs);
        parentRepository.findById.mockImplementation((parentId) =>
          Promise.resolve(mockParents[parentId]),
        );

        const result = await useCase.execute(input);

        expect(result.arrivals).toHaveLength(2);
        expect(result.arrivals[0].parentName).toBe('Alice');
        expect(result.arrivals[1].parentName).toBe('Bob');
        expect(result.totalCount).toBe(4);
      });

      it('should return all results when limit exceeds total count', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETAs: ETA[] = [
          {
            id: 'eta-1',
            parentId: 'parent-1',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 300,
            routePolyline: 'polyline1',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-2',
            parentId: 'parent-2',
            schoolId,
            distanceMeters: 10000,
            durationSeconds: 600,
            routePolyline: 'polyline2',
            calculatedAt: new Date(),
          },
        ];

        const mockParents: Record<string, Parent> = {
          'parent-1': {
            id: 'parent-1',
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+1111111111',
            schoolId,
            createdAt: new Date(),
          },
          'parent-2': {
            id: 'parent-2',
            name: 'Bob',
            email: 'bob@example.com',
            phone: '+2222222222',
            schoolId,
            createdAt: new Date(),
          },
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
          limit: 100,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue(mockETAs);
        parentRepository.findById.mockImplementation((parentId) =>
          Promise.resolve(mockParents[parentId]),
        );

        const result = await useCase.execute(input);

        expect(result.arrivals).toHaveLength(2);
        expect(result.totalCount).toBe(2);
      });
    });

    describe('Parent Information', () => {
      it('should throw error when parent not found for ETA', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 600,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(
          `Parent with id ${parentId} not found`,
        );
      });

      it('should include parent name in arrival info', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 600,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const mockParent: Parent = {
          id: parentId,
          name: 'Maria da Silva',
          email: 'maria@example.com',
          phone: '+5511999999999',
          schoolId,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(mockParent);

        const result = await useCase.execute(input);

        expect(result.arrivals[0].parentName).toBe('Maria da Silva');
      });
    });

    describe('ETA Time Conversion', () => {
      it('should convert duration seconds to minutes correctly', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 1380, // 23 minutes
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(mockParent);

        const result = await useCase.execute(input);

        expect(result.arrivals[0].etaMinutes).toBe(23);
      });

      it('should round duration correctly', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 599, // 9.98 minutes -> rounds to 10
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(mockParent);

        const result = await useCase.execute(input);

        expect(result.arrivals[0].etaMinutes).toBe(10);
      });
    });

    describe('School Information', () => {
      it('should include school name in response', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Thomas Jefferson High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([]);

        const result = await useCase.execute(input);

        expect(result.schoolName).toBe('Thomas Jefferson High School');
      });

      it('should include total count before limit', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETAs: ETA[] = [
          {
            id: 'eta-1',
            parentId: 'parent-1',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 300,
            routePolyline: 'polyline1',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-2',
            parentId: 'parent-2',
            schoolId,
            distanceMeters: 10000,
            durationSeconds: 600,
            routePolyline: 'polyline2',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-3',
            parentId: 'parent-3',
            schoolId,
            distanceMeters: 15000,
            durationSeconds: 900,
            routePolyline: 'polyline3',
            calculatedAt: new Date(),
          },
        ];

        const mockParents: Record<string, Parent> = {
          'parent-1': {
            id: 'parent-1',
            name: 'Alice',
            email: 'alice@example.com',
            phone: '+1111111111',
            schoolId,
            createdAt: new Date(),
          },
          'parent-2': {
            id: 'parent-2',
            name: 'Bob',
            email: 'bob@example.com',
            phone: '+2222222222',
            schoolId,
            createdAt: new Date(),
          },
          'parent-3': {
            id: 'parent-3',
            name: 'Charlie',
            email: 'charlie@example.com',
            phone: '+3333333333',
            schoolId,
            createdAt: new Date(),
          },
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
          limit: 2,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue(mockETAs);
        parentRepository.findById.mockImplementation((parentId) =>
          Promise.resolve(mockParents[parentId]),
        );

        const result = await useCase.execute(input);

        expect(result.totalCount).toBe(3);
        expect(result.arrivals).toHaveLength(2);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero distance', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 0,
          durationSeconds: 0,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(mockParent);

        const result = await useCase.execute(input);

        expect(result.arrivals[0].distanceMeters).toBe(0);
        expect(result.arrivals[0].etaMinutes).toBe(0);
      });

      it('should handle special characters in parent name', async () => {
        const schoolId = 'school-123';
        const parentId = 'parent-456';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETA: ETA = {
          id: 'eta-789',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 600,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const mockParent: Parent = {
          id: parentId,
          name: "José O'Connor-García",
          email: 'jose@example.com',
          phone: '+5511999999999',
          schoolId,
          createdAt: new Date(),
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue([mockETA]);
        parentRepository.findById.mockResolvedValue(mockParent);

        const result = await useCase.execute(input);

        expect(result.arrivals[0].parentName).toBe("José O'Connor-García");
      });
    });

    describe('Integration - Full Happy Path', () => {
      it('should execute complete flow: validate school, fetch ETAs, enrich with parents, sort, apply limit, return result', async () => {
        const schoolId = 'school-123';

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockETAs: ETA[] = [
          {
            id: 'eta-1',
            parentId: 'parent-3',
            schoolId,
            distanceMeters: 30000,
            durationSeconds: 1800,
            routePolyline: 'polyline3',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-2',
            parentId: 'parent-1',
            schoolId,
            distanceMeters: 5000,
            durationSeconds: 300,
            routePolyline: 'polyline1',
            calculatedAt: new Date(),
          },
          {
            id: 'eta-3',
            parentId: 'parent-2',
            schoolId,
            distanceMeters: 15000,
            durationSeconds: 900,
            routePolyline: 'polyline2',
            calculatedAt: new Date(),
          },
        ];

        const mockParents: Record<string, Parent> = {
          'parent-1': {
            id: 'parent-1',
            name: 'Alice Cooper',
            email: 'alice@example.com',
            phone: '+1111111111',
            schoolId,
            createdAt: new Date(),
          },
          'parent-2': {
            id: 'parent-2',
            name: 'Bob Dylan',
            email: 'bob@example.com',
            phone: '+2222222222',
            schoolId,
            createdAt: new Date(),
          },
          'parent-3': {
            id: 'parent-3',
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            phone: '+3333333333',
            schoolId,
            createdAt: new Date(),
          },
        };

        const input: GetArrivalsQueueInput = {
          schoolId,
          limit: 2,
        };

        schoolRepository.findById.mockResolvedValue(mockSchool);
        etaRepository.findBySchoolId.mockResolvedValue(mockETAs);
        parentRepository.findById.mockImplementation((parentId) =>
          Promise.resolve(mockParents[parentId]),
        );

        const result = await useCase.execute(input);

        expect(schoolRepository.findById).toHaveBeenCalledWith(schoolId);
        expect(etaRepository.findBySchoolId).toHaveBeenCalledWith(schoolId);
        expect(parentRepository.findById).toHaveBeenCalledTimes(3);

        expect(result.schoolName).toBe('Lincoln High School');
        expect(result.totalCount).toBe(3);
        expect(result.arrivals).toHaveLength(2);

        // Verify sorted order
        expect(result.arrivals[0].parentName).toBe('Alice Cooper');
        expect(result.arrivals[0].etaMinutes).toBe(5);
        expect(result.arrivals[1].parentName).toBe('Bob Dylan');
        expect(result.arrivals[1].etaMinutes).toBe(15);
      });
    });
  });
});
