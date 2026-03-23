import {
  Controller,
  Get,
  HttpStatus,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  checks: {
    database: 'ok' | 'error';
  };
}

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const checks = {
      database: await this.checkDatabase(),
    };

    const hasErrors = Object.values(checks).some((check) => check === 'error');
    const status = hasErrors ? 'error' : 'ok';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: 'onMyWay-api',
      version: '1.0.0',
      checks,
    };
  }

  private async checkDatabase(): Promise<'ok' | 'error'> {
    try {
      if (!this.dataSource.isInitialized) {
        return 'error';
      }

      await this.dataSource.query('SELECT 1');
      return 'ok';
    } catch {
      return 'error';
    }
  }
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check service health and database connectivity',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-03-23T16:37:00.000Z',
        uptime: 3600,
        service: 'onMyWay-api',
        version: '1.0.0',
        checks: {
          database: 'ok',
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service is degraded',
    schema: {
      example: {
        status: 'error',
        timestamp: '2026-03-23T16:37:00.000Z',
        uptime: 3600,
        service: 'onMyWay-api',
        version: '1.0.0',
        checks: {
          database: 'error',
        },
      },
    },
  })
  async health(): Promise<HealthCheckResponse> {
    const healthStatus = await this.healthService.checkHealth();

    if (healthStatus.status === 'error') {
      throw new HttpException(healthStatus, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return healthStatus;
  }
}
