import { StopSharingUseCase } from './stop-sharing.use-case';
import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { GetSchoolArrivalsUseCase } from './get-school-arrivals.use-case';
import { ArrivalsGateway } from '../../infrastructure/websocket/arrivals.gateway';
import { School } from '../entities/school.entity';

describe('StopSharingUseCase', () => {
  let useCase: StopSharingUseCase;
  let etaRepository: jest.Mocked<IETARepository>;
  let schoolRepository: jest.Mocked<ISchoolRepository>;
  let getSchoolArrivalsUseCase: jest.Mocked<GetSchoolArrivalsUseCase>;
  let arrivalsGateway: jest.Mocked<ArrivalsGateway>;

  beforeEach(() => {
    etaRepository = {
      deleteByParentId: jest.fn(),
    } as any;

    schoolRepository = {
      findById: jest.fn(),
    } as any;

    getSchoolArrivalsUseCase = {
      execute: jest.fn(),
    } as any;

    arrivalsGateway = {
      emitArrivalsUpdated: jest.fn(),
    } as any;

    useCase = new StopSharingUseCase(
      etaRepository,
      schoolRepository,
      getSchoolArrivalsUseCase,
      arrivalsGateway,
    );
  });

  describe('execute', () => {
    it('should delete ETA records for parent', async () => {
      const input = {
        parentId: 'parent-123',
        schoolId: 'school-456',
      };

      const school: School = {
        id: 'school-456',
        name: 'Test School',
        lat: -23.55052,
        lng: -46.633308,
        geofenceRadiusMeters: 100,
        notificationThresholdMeters: 500,
        inviteCode: 'AB3X7Y2Z',
        createdAt: new Date(),
      };

      schoolRepository.findById.mockResolvedValue(school);
      getSchoolArrivalsUseCase.execute.mockResolvedValue({
        arrivals: [],
        schoolName: 'Test School',
        totalCount: 0,
      });

      const result = await useCase.execute(input);

      expect(result.deleted).toBe(true);
      expect(etaRepository.deleteByParentId).toHaveBeenCalledWith('parent-123');
    });

    it('should emit WebSocket notification after deletion', async () => {
      const input = {
        parentId: 'parent-123',
        schoolId: 'school-456',
      };

      const school: School = {
        id: 'school-456',
        name: 'Test School',
        lat: -23.55052,
        lng: -46.633308,
        geofenceRadiusMeters: 100,
        notificationThresholdMeters: 500,
        inviteCode: 'AB3X7Y2Z',
        createdAt: new Date(),
      };

      const arrivalsOutput = {
        arrivals: [],
        schoolName: 'Test School',
        totalCount: 0,
      };

      schoolRepository.findById.mockResolvedValue(school);
      getSchoolArrivalsUseCase.execute.mockResolvedValue(arrivalsOutput);

      await useCase.execute(input);

      expect(getSchoolArrivalsUseCase.execute).toHaveBeenCalledWith({
        schoolId: 'school-456',
      });
      expect(arrivalsGateway.emitArrivalsUpdated).toHaveBeenCalledWith(
        'school-456',
        [],
        'Test School',
      );
    });

    it('should not emit WebSocket if school not found', async () => {
      const input = {
        parentId: 'parent-123',
        schoolId: 'school-456',
      };

      schoolRepository.findById.mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(result.deleted).toBe(true);
      expect(etaRepository.deleteByParentId).toHaveBeenCalledWith('parent-123');
      expect(getSchoolArrivalsUseCase.execute).not.toHaveBeenCalled();
      expect(arrivalsGateway.emitArrivalsUpdated).not.toHaveBeenCalled();
    });

    it('should handle deletion when schoolId is empty', async () => {
      const input = {
        parentId: 'parent-123',
        schoolId: '',
      };

      const result = await useCase.execute(input);

      expect(result.deleted).toBe(true);
      expect(etaRepository.deleteByParentId).toHaveBeenCalledWith('parent-123');
      expect(schoolRepository.findById).not.toHaveBeenCalled();
    });
  });
});
