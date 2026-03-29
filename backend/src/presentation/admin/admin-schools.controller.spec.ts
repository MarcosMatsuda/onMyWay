import { Test, TestingModule } from '@nestjs/testing';
import { AdminSchoolsController } from './admin-schools.controller';
import { ListSchoolsUseCase } from '../../domain/use-cases/list-schools.use-case';
import { CreateSchoolUseCase } from '../../domain/use-cases/create-school.use-case';
import { GetSchoolUseCase } from '../../domain/use-cases/get-school.use-case';
import { GetSchoolInviteUseCase } from '../../domain/use-cases/get-school-invite.use-case';
import { RegenerateSchoolInviteUseCase } from '../../domain/use-cases/regenerate-school-invite.use-case';
import { ListSchoolParentsUseCase } from '../../domain/use-cases/list-school-parents.use-case';
import { ListSchoolAdminsUseCase } from '../../domain/use-cases/list-school-admins.use-case';
import { GetSchoolArrivalsUseCase } from '../../domain/use-cases/get-school-arrivals.use-case';
import { GetSchoolStatsUseCase } from '../../domain/use-cases/get-school-stats.use-case';
import { UpdateSchoolConfigUseCase } from '../../domain/use-cases/update-school-config.use-case';

const mockSchool = {
  id: 'school-123',
  name: 'Test School',
  lat: -23.5505,
  lng: -46.6333,
  geofenceRadiusMeters: 500,
  notificationThresholdMeters: 1000,
  inviteCode: 'AB3X7Y2Z',
  createdAt: new Date(),
};

const mockArrivals = {
  arrivals: [
    {
      parentId: 'parent-1',
      parentName: 'John Doe',
      lat: -23.5505,
      lng: -46.6333,
      distanceMeters: 1000,
      etaMinutes: 10,
      routePolyline: 'encoded_polyline',
      calculatedAt: new Date(),
    },
  ],
  schoolName: 'Test School',
  totalCount: 1,
};

const mockStats = {
  totalParents: 50,
  avgETA: 12.5,
  etaLessThan5Min: 10,
  eta5To15Min: 25,
  etaGreaterThan15Min: 15,
};

describe('AdminSchoolsController', () => {
  let controller: AdminSchoolsController;
  let listSchoolsUseCase: jest.Mocked<ListSchoolsUseCase>;
  let createSchoolUseCase: jest.Mocked<CreateSchoolUseCase>;
  let getSchoolUseCase: jest.Mocked<GetSchoolUseCase>;
  let getSchoolArrivalsUseCase: jest.Mocked<GetSchoolArrivalsUseCase>;
  let getSchoolStatsUseCase: jest.Mocked<GetSchoolStatsUseCase>;
  let updateSchoolConfigUseCase: jest.Mocked<UpdateSchoolConfigUseCase>;

  beforeEach(async () => {
    const mockListSchoolsUseCase = {
      execute: jest.fn(),
    };
    const mockCreateSchoolUseCase = {
      execute: jest.fn(),
    };
    const mockGetSchoolUseCase = {
      execute: jest.fn(),
    };
    const mockGetSchoolInviteUseCase = {
      execute: jest.fn(),
    };
    const mockRegenerateSchoolInviteUseCase = {
      execute: jest.fn(),
    };
    const mockListSchoolParentsUseCase = {
      execute: jest.fn(),
    };
    const mockListSchoolAdminsUseCase = {
      execute: jest.fn(),
    };
    const mockGetSchoolArrivalsUseCase = {
      execute: jest.fn(),
    };
    const mockGetSchoolStatsUseCase = {
      execute: jest.fn(),
    };
    const mockUpdateSchoolConfigUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSchoolsController],
      providers: [
        { provide: ListSchoolsUseCase, useValue: mockListSchoolsUseCase },
        { provide: CreateSchoolUseCase, useValue: mockCreateSchoolUseCase },
        { provide: GetSchoolUseCase, useValue: mockGetSchoolUseCase },
        {
          provide: GetSchoolInviteUseCase,
          useValue: mockGetSchoolInviteUseCase,
        },
        {
          provide: RegenerateSchoolInviteUseCase,
          useValue: mockRegenerateSchoolInviteUseCase,
        },
        {
          provide: ListSchoolParentsUseCase,
          useValue: mockListSchoolParentsUseCase,
        },
        {
          provide: ListSchoolAdminsUseCase,
          useValue: mockListSchoolAdminsUseCase,
        },
        {
          provide: GetSchoolArrivalsUseCase,
          useValue: mockGetSchoolArrivalsUseCase,
        },
        { provide: GetSchoolStatsUseCase, useValue: mockGetSchoolStatsUseCase },
        {
          provide: UpdateSchoolConfigUseCase,
          useValue: mockUpdateSchoolConfigUseCase,
        },
      ],
    }).compile();

    controller = module.get<AdminSchoolsController>(AdminSchoolsController);
    listSchoolsUseCase = module.get(
      ListSchoolsUseCase,
    ) as jest.Mocked<ListSchoolsUseCase>;
    createSchoolUseCase = module.get(
      CreateSchoolUseCase,
    ) as jest.Mocked<CreateSchoolUseCase>;
    getSchoolUseCase = module.get(
      GetSchoolUseCase,
    ) as jest.Mocked<GetSchoolUseCase>;
    getSchoolArrivalsUseCase = module.get(
      GetSchoolArrivalsUseCase,
    ) as jest.Mocked<GetSchoolArrivalsUseCase>;
    getSchoolStatsUseCase = module.get(
      GetSchoolStatsUseCase,
    ) as jest.Mocked<GetSchoolStatsUseCase>;
    updateSchoolConfigUseCase = module.get(
      UpdateSchoolConfigUseCase,
    ) as jest.Mocked<UpdateSchoolConfigUseCase>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list all schools', async () => {
    listSchoolsUseCase.execute.mockResolvedValue({ schools: [mockSchool] });

    const result = await controller.listSchools();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('school-123');
    expect(result[0].name).toBe('Test School');
    expect(listSchoolsUseCase.execute).toHaveBeenCalled();
  });

  it('should create a school', async () => {
    createSchoolUseCase.execute.mockResolvedValue(mockSchool);

    const createDto = {
      name: 'Test School',
      lat: -23.5505,
      lng: -46.6333,
      geofenceRadiusMeters: 500,
      notificationThresholdMeters: 1000,
    };

    const result = await controller.createSchool(createDto);

    expect(result.id).toBe('school-123');
    expect(result.name).toBe('Test School');
    expect(createSchoolUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining(createDto),
    );
  });

  it('should get school detail', async () => {
    getSchoolUseCase.execute.mockResolvedValue(mockSchool);

    const result = await controller.getSchool('school-123');

    expect(result.id).toBe('school-123');
    expect(getSchoolUseCase.execute).toHaveBeenCalledWith('school-123');
  });

  it('should get school arrivals', async () => {
    getSchoolArrivalsUseCase.execute.mockResolvedValue(mockArrivals);

    const result = await controller.getArrivals('school-123');

    expect(result).toHaveLength(1);
    expect(result[0].parentId).toBe('parent-1');
    expect(getSchoolArrivalsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: 'school-123' }),
    );
  });

  it('should get school stats', async () => {
    getSchoolStatsUseCase.execute.mockResolvedValue(mockStats);

    const result = await controller.getStats('school-123');

    expect(result.totalParents).toBe(50);
    expect(result.avgETA).toBe(12.5);
    expect(getSchoolStatsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ schoolId: 'school-123' }),
    );
  });

  it('should update school config', async () => {
    const configResult = {
      id: 'school-123',
      name: 'Test School',
      geofenceRadiusMeters: 600,
      notificationThresholdMeters: 1200,
      updatedAt: new Date(),
    };
    updateSchoolConfigUseCase.execute.mockResolvedValue(configResult);

    const configDto = {
      geofenceRadiusMeters: 600,
      notificationThresholdMeters: 1200,
    };

    const result = await controller.updateConfig('school-123', configDto);

    expect(result.geofenceRadiusMeters).toBe(600);
    expect(updateSchoolConfigUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: 'school-123',
        ...configDto,
      }),
    );
  });
});
