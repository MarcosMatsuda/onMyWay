import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
  checks: Record<string, string>;
}

@Injectable()
export class HealthService {
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      service: 'onMyWay-api',
      version: '1.0.0',
      checks: {},
    };
  }
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check service health status',
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
        checks: {},
      },
    },
  })
  health(): HealthCheckResponse {
    return this.healthService.getHealth();
  }
}
