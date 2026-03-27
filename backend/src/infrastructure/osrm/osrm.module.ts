import { Module, Global } from '@nestjs/common';
import { OSRMService } from './osrm.service';
import { OSRMServiceAdapter } from './osrm-service.adapter';
import { OSRMConfig } from './osrm.types';

/**
 * OSRM Module for route calculation and ETA
 */
@Global()
@Module({
  providers: [
    {
      provide: 'OSRM_CONFIG',
      useFactory: (): OSRMConfig => ({
        baseUrl: process.env.OSRM_BASE_URL || 'http://router.project-osrm.org',
        timeout: parseInt(process.env.OSRM_TIMEOUT_MS || '10000', 10),
      }),
    },
    OSRMService,
    OSRMServiceAdapter,
  ],
  exports: [OSRMService, OSRMServiceAdapter],
})
export class OSRMModule {}
