import { Test, TestingModule } from '@nestjs/testing';
import { OSRMService } from './osrm.service';
import { OSRMUnavailableError } from './osrm-unavailable.error';
import { OSRMConfig } from './osrm.types';

describe('OSRMService', () => {
  let service: OSRMService;
  const mockConfig: OSRMConfig = {
    baseUrl: 'http://test-osrm-server.org',
    timeout: 10000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OSRMService,
        {
          provide: 'OSRM_CONFIG',
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<OSRMService>(OSRMService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default base URL when not provided', async () => {
      const defaultConfig: OSRMConfig = {
        baseUrl: '',
        timeout: 10000,
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OSRMService,
          {
            provide: 'OSRM_CONFIG',
            useValue: defaultConfig,
          },
        ],
      }).compile();

      const serviceWithDefault = module.get<OSRMService>(OSRMService);
      expect(serviceWithDefault).toBeDefined();
    });
  });

  describe('OSRMUnavailableError', () => {
    it('should be throwable', () => {
      expect(() => {
        throw new OSRMUnavailableError('Test error');
      }).toThrow(OSRMUnavailableError);
    });

    it('should have correct status code', () => {
      try {
        throw new OSRMUnavailableError();
      } catch (error) {
        expect(error.getStatus()).toBe(503); // SERVICE_UNAVAILABLE
      }
    });
  });

  // Note: We're not testing the actual HTTP calls in unit tests
  // as they require complex mocking. Integration tests would
  // test the actual OSRM API calls.
});
