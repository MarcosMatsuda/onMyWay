import {
  CalculateETAUseCase,
  CalculateETAInput,
  IOSRMServiceAdapter,
} from './calculate-eta.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ILocationRepository } from '../repositories/location.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';
import { ETA } from '../entities/eta.entity';
import { Parent } from '../entities/parent.entity';
import { School } from '../entities/school.entity';
import { Location } from '../entities/location.entity';

describe('CalculateETAUseCase', () => {
  let useCase: CalculateETAUseCase;
  let etaRepository: jest.Mocked<IETARepository>;
  let locationRepository: jest.Mocked<ILocationRepository>;
  let schoolRepository: jest.Mocked<ISchoolRepository>;
  let parentRepository: jest.Mocked<IParentRepository>;
  let osrmService: jest.Mocked<IOSRMServiceAdapter>;

  beforeEach(() => {
    etaRepository = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findBySchoolId: jest.fn(),
    } as any;

    locationRepository = {
      save: jest.fn(),
      findLatestByParentId: jest.fn(),
      findParentsNearSchool: jest.fn(),
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

    osrmService = {
      calculateRoute: jest.fn(),
    } as any;

    useCase = new CalculateETAUseCase(
      etaRepository,
      locationRepository,
      schoolRepository,
      parentRepository,
      osrmService,
    );
  });

  describe('execute', () => {
    describe('Parent Validation', () => {
      it('should throw error when parent does not exist', async () => {
        const input: CalculateETAInput = {
          parentId: 'non-existent-parent',
        };

        parentRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(
          'Parent with id non-existent-parent not found',
        );
        expect(parentRepository.findById).toHaveBeenCalledWith(
          'non-existent-parent',
        );
        expect(schoolRepository.findById).not.toHaveBeenCalled();
        expect(locationRepository.findLatestByParentId).not.toHaveBeenCalled();
        expect(osrmService.calculateRoute).not.toHaveBeenCalled();
        expect(etaRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('School Validation', () => {
      it('should throw error when school does not exist', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(
          `School with id ${schoolId} not found`,
        );
        expect(parentRepository.findById).toHaveBeenCalledWith(parentId);
        expect(schoolRepository.findById).toHaveBeenCalledWith(schoolId);
        expect(locationRepository.findLatestByParentId).not.toHaveBeenCalled();
        expect(osrmService.calculateRoute).not.toHaveBeenCalled();
        expect(etaRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('Location Validation', () => {
      it('should throw error when parent has no location', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(null);

        await expect(useCase.execute(input)).rejects.toThrow(
          `No location found for parent ${parentId}`,
        );
        expect(parentRepository.findById).toHaveBeenCalledWith(parentId);
        expect(schoolRepository.findById).toHaveBeenCalledWith(schoolId);
        expect(locationRepository.findLatestByParentId).toHaveBeenCalledWith(
          parentId,
        );
        expect(osrmService.calculateRoute).not.toHaveBeenCalled();
        expect(etaRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('OSRM Integration', () => {
      it('should call OSRM service with correct coordinates from parent location to school', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7849,
          lng: -122.4094,
          accuracy: 10,
          timestamp: new Date(),
        };

        const mockRouteResponse = {
          distanceMeters: 5000,
          durationSeconds: 600,
          polyline: 'encoded_polyline_data',
        };

        const mockETA: ETA = {
          id: 'eta-123',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 600,
          routePolyline: 'encoded_polyline_data',
          calculatedAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockResolvedValue(mockRouteResponse);
        etaRepository.save.mockResolvedValue(mockETA);

        const result = await useCase.execute(input);

        expect(osrmService.calculateRoute).toHaveBeenCalledWith(
          37.7849,
          -122.4094,
          37.7749,
          -122.4194,
        );
        expect(result.distanceMeters).toBe(5000);
        expect(result.durationMinutes).toBe(10);
      });

      it('should handle OSRM service error gracefully', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7849,
          lng: -122.4094,
          accuracy: 10,
          timestamp: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockRejectedValue(
          new Error('OSRM service unavailable'),
        );

        await expect(useCase.execute(input)).rejects.toThrow(
          'OSRM service unavailable',
        );
        expect(etaRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('ETA Calculation', () => {
      it('should calculate ETA in minutes correctly', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7849,
          lng: -122.4094,
          accuracy: 10,
          timestamp: new Date(),
        };

        // 900 seconds = 15 minutes
        const mockRouteResponse = {
          distanceMeters: 10000,
          durationSeconds: 900,
          polyline: 'polyline',
        };

        const mockETA: ETA = {
          id: 'eta-123',
          parentId,
          schoolId,
          distanceMeters: 10000,
          durationSeconds: 900,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockResolvedValue(mockRouteResponse);
        etaRepository.save.mockResolvedValue(mockETA);

        const result = await useCase.execute(input);

        expect(result.durationMinutes).toBe(15);
      });

      it('should round duration minutes correctly', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7849,
          lng: -122.4094,
          accuracy: 10,
          timestamp: new Date(),
        };

        // 599 seconds = 9.98 minutes, should round to 10
        const mockRouteResponse = {
          distanceMeters: 5000,
          durationSeconds: 599,
          polyline: 'polyline',
        };

        const mockETA: ETA = {
          id: 'eta-123',
          parentId,
          schoolId,
          distanceMeters: 5000,
          durationSeconds: 599,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockResolvedValue(mockRouteResponse);
        etaRepository.save.mockResolvedValue(mockETA);

        const result = await useCase.execute(input);

        expect(result.durationMinutes).toBe(10);
      });

      it('should handle zero duration', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7749,
          lng: -122.4194,
          accuracy: 10,
          timestamp: new Date(),
        };

        // 30 seconds = 0.5 minutes, should round to 1
        const mockRouteResponse = {
          distanceMeters: 100,
          durationSeconds: 30,
          polyline: 'polyline',
        };

        const mockETA: ETA = {
          id: 'eta-123',
          parentId,
          schoolId,
          distanceMeters: 100,
          durationSeconds: 30,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockResolvedValue(mockRouteResponse);
        etaRepository.save.mockResolvedValue(mockETA);

        const result = await useCase.execute(input);

        expect(result.durationMinutes).toBe(1);
        expect(result.distanceMeters).toBe(100);
      });

      it('should handle very long distances', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7849,
          lng: -122.4094,
          accuracy: 10,
          timestamp: new Date(),
        };

        // 7200 seconds = 120 minutes = 2 hours
        const mockRouteResponse = {
          distanceMeters: 150000,
          durationSeconds: 7200,
          polyline: 'polyline',
        };

        const mockETA: ETA = {
          id: 'eta-123',
          parentId,
          schoolId,
          distanceMeters: 150000,
          durationSeconds: 7200,
          routePolyline: 'polyline',
          calculatedAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockResolvedValue(mockRouteResponse);
        etaRepository.save.mockResolvedValue(mockETA);

        const result = await useCase.execute(input);

        expect(result.durationMinutes).toBe(120);
        expect(result.distanceMeters).toBe(150000);
      });
    });

    describe('Integration - Full Happy Path', () => {
      it('should execute complete flow: validate parent, school, location, call OSRM, save ETA', async () => {
        const parentId = 'parent-123';
        const schoolId = 'school-456';

        const mockParent: Parent = {
          id: parentId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          schoolId,
          createdAt: new Date(),
        };

        const mockSchool: School = {
          id: schoolId,
          name: 'Lincoln High School',
          lat: 37.7749,
          lng: -122.4194,
          geofenceRadiusMeters: 500,
          notificationThresholdMeters: 1000,
          createdAt: new Date(),
        };

        const mockLocation: Location = {
          id: 'location-789',
          parentId,
          lat: 37.7849,
          lng: -122.4094,
          accuracy: 15,
          timestamp: new Date(),
        };

        const mockRouteResponse = {
          distanceMeters: 12000,
          durationSeconds: 1200,
          polyline: 'encoded_route_polyline',
        };

        const mockETA: ETA = {
          id: 'eta-999',
          parentId,
          schoolId,
          distanceMeters: 12000,
          durationSeconds: 1200,
          routePolyline: 'encoded_route_polyline',
          calculatedAt: new Date(),
        };

        const input: CalculateETAInput = {
          parentId,
        };

        parentRepository.findById.mockResolvedValue(mockParent);
        schoolRepository.findById.mockResolvedValue(mockSchool);
        locationRepository.findLatestByParentId.mockResolvedValue(
          mockLocation,
        );
        osrmService.calculateRoute.mockResolvedValue(mockRouteResponse);
        etaRepository.save.mockResolvedValue(mockETA);

        const result = await useCase.execute(input);

        expect(parentRepository.findById).toHaveBeenCalledWith(parentId);
        expect(schoolRepository.findById).toHaveBeenCalledWith(schoolId);
        expect(locationRepository.findLatestByParentId).toHaveBeenCalledWith(
          parentId,
        );
        expect(osrmService.calculateRoute).toHaveBeenCalledWith(
          37.7849,
          -122.4094,
          37.7749,
          -122.4194,
        );
        expect(etaRepository.save).toHaveBeenCalled();

        expect(result.eta).toEqual(mockETA);
        expect(result.distanceMeters).toBe(12000);
        expect(result.durationMinutes).toBe(20);
      });
    });
  });
});
