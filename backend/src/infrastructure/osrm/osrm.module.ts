import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
      inject: [ConfigService],
      useFactory: (configService: ConfigService): OSRMConfig => ({
        baseUrl: configService.get<string>('OSRM_BASE_URL'),
        timeout: parseInt(
          configService.get<string>('OSRM_TIMEOUT_MS') || '10000',
          10,
        ),
      }),
    },
    OSRMService,
    OSRMServiceAdapter,
  ],
  exports: [OSRMService, OSRMServiceAdapter],
})
export class OSRMModule {}
