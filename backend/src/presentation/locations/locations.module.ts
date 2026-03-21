import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { SaveLocationUseCase } from '../../domain/use-cases/save-location.use-case';
import { CalculateETAUseCase } from '../../domain/use-cases/calculate-eta.use-case';
import { GetArrivalsQueueUseCase } from '../../domain/use-cases/get-arrivals-queue.use-case';
import { DataModule } from '../../data/data.module';
import { OSRMModule } from '../../infrastructure/osrm/osrm.module';
import { OSRMServiceAdapter } from '../../infrastructure/osrm/osrm-service.adapter';

@Module({
  imports: [DataModule, OSRMModule],
  controllers: [LocationsController],
  providers: [
    LocationsService,
    SaveLocationUseCase,
    CalculateETAUseCase,
    GetArrivalsQueueUseCase,
    {
      provide: 'IOSRMServiceAdapter',
      useClass: OSRMServiceAdapter,
    },
  ],
})
export class LocationsModule {}