import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController, HealthService } from './health.controller';

describe('HealthController & HealthService', () => {
  let controller: HealthController;
  let service: HealthService;
  let mockDataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
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

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  describe('HealthService', () => {
    describe('checkHealth', () => {
      it('should return ok status when DataSource is initialized and SELECT 1 succeeds', async () => {
        // Act
        const result = await service.checkHealth();

        // Assert
        expect(result.status).toBe('ok');
        expect(result.checks.database).toBe('ok');
      });

      it('should return error status when DataSource is not initialized', async () => {
        // Arrange
        (mockDataSource as any).isInitialized = false;

        // Act
        const result = await service.checkHealth();

        // Assert
        expect(result.status).toBe('error');
        expect(result.checks.database).toBe('error');
      });

      it('should return error status when query throws', async () => {
        // Arrange
        (mockDataSource.query as jest.Mock).mockRejectedValue(
          new Error('Connection failed'),
        );

        // Act
        const result = await service.checkHealth();

        // Assert
        expect(result.status).toBe('error');
        expect(result.checks.database).toBe('error');
      });

      it('should include timestamp in ISO 8601 format', async () => {
        // Act
        const result = await service.checkHealth();

        // Assert
        expect(result.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });

      it('should include uptime as a number', async () => {
        // Act
        const result = await service.checkHealth();

        // Assert
        expect(typeof result.uptime).toBe('number');
        expect(result.uptime).toBeGreaterThanOrEqual(0);
      });

      it('should include service name onMyWay-api', async () => {
        // Act
        const result = await service.checkHealth();

        // Assert
        expect(result.service).toBe('onMyWay-api');
      });

      it('should include version field', async () => {
        // Act
        const result = await service.checkHealth();

        // Assert
        expect(result.version).toBeDefined();
        expect(typeof result.version).toBe('string');
      });

      it('should call database query with SELECT 1', async () => {
        // Act
        await service.checkHealth();

        // Assert
        expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
      });
    });
  });

  describe('HealthController', () => {
    describe('GET /health', () => {
      it('should return status ok when database is healthy', async () => {
        // Act
        const result = await controller.health();

        // Assert
        expect(result.status).toBe('ok');
      });

      it('should return HTTP 200 when all checks pass', async () => {
        // Act
        const result = await controller.health();

        // Assert
        expect(result).toBeDefined();
        expect(result.status).toBe('ok');
      });

      it('should throw HttpException 503 when database check fails', async () => {
        // Arrange
        (mockDataSource.query as jest.Mock).mockRejectedValue(
          new Error('Connection timeout'),
        );

        // Act & Assert
        await expect(controller.health()).rejects.toThrow(HttpException);
        try {
          await controller.health();
        } catch (err: any) {
          expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        }
      });

      it('should include timestamp in ISO 8601 format', async () => {
        // Act
        const result = await controller.health();

        // Assert
        expect(result.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });

      it('should include uptime as a number', async () => {
        // Act
        const result = await controller.health();

        // Assert
        expect(typeof result.uptime).toBe('number');
        expect(result.uptime).toBeGreaterThanOrEqual(0);
      });

      it('should include service name onMyWay-api', async () => {
        // Act
        const result = await controller.health();

        // Assert
        expect(result.service).toBe('onMyWay-api');
      });

      it('should include version field', async () => {
        // Act
        const result = await controller.health();

        // Assert
        expect(result.version).toBeDefined();
        expect(typeof result.version).toBe('string');
      });

      it('should include all required fields in response', async () => {
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

      it('should return error response structure when database is down', async () => {
        // Arrange
        (mockDataSource.query as jest.Mock).mockRejectedValue(
          new Error('DB error'),
        );

        // Act & Assert
        try {
          await controller.health();
          fail('Should have thrown');
        } catch (error: any) {
          expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
          expect(error.getResponse()).toEqual({
            status: 'error',
            timestamp: expect.any(String),
            uptime: expect.any(Number),
            service: 'onMyWay-api',
            version: expect.any(String),
            checks: {
              database: 'error',
            },
          });
        }
      });
    });
  });
});
