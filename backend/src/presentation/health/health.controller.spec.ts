import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController, HealthService } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let dataSourceMock: jest.Mocked<DataSource>;

  beforeEach(async () => {
    dataSourceMock = {
      isInitialized: true,
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        HealthService,
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('health', () => {
    it('should return health status when database is ok', async () => {
      // Arrange
      dataSourceMock.query.mockResolvedValue([{ '?column?': 1 }]);

      // Act
      const result = await controller.health();

      // Assert
      expect(result.status).toBe('ok');
      expect(result.service).toBe('onMyWay-api');
      expect(result.version).toBe('0.1.0');
      expect(result.checks.database).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return healthy response with correct timestamp format', async () => {
      // Arrange
      dataSourceMock.query.mockResolvedValue([{ '?column?': 1 }]);

      // Act
      const result = await controller.health();

      // Assert
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return healthy response with uptime', async () => {
      // Arrange
      dataSourceMock.query.mockResolvedValue([{ '?column?': 1 }]);

      // Act
      const result = await controller.health();

      // Assert
      expect(result.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof result.uptime).toBe('number');
    });

    it('should return error status when database check fails', async () => {
      // Arrange
      dataSourceMock.query.mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(controller.health()).rejects.toMatchObject({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Service unavailable',
      });
    });

    it('should check database connectivity', async () => {
      // Arrange
      dataSourceMock.query.mockResolvedValue([{ '?column?': 1 }]);

      // Act
      await controller.health();

      // Assert
      expect(dataSourceMock.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should return error if DataSource is not initialized', async () => {
      // Arrange
      const mockDataSource = {
        isInitialized: false,
        query: jest.fn(),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [HealthController],
        providers: [
          {
            provide: DataSource,
            useValue: mockDataSource,
          },
          HealthService,
        ],
      }).compile();

      const testController = module.get<HealthController>(HealthController);

      // Act & Assert
      await expect(testController.health()).rejects.toMatchObject({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      });
    });

    it('should include all required fields in response', async () => {
      // Arrange
      dataSourceMock.query.mockResolvedValue([{ '?column?': 1 }]);

      // Act
      const result = await controller.health();

      // Assert
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
    });
  });
});
