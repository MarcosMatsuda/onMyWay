import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { SaveLocationWithETAUseCase } from '../../domain/use-cases/save-location-with-eta.use-case';
import { CalculateETAUseCase } from '../../domain/use-cases/calculate-eta.use-case';
import { GetArrivalsQueueUseCase } from '../../domain/use-cases/get-arrivals-queue.use-case';
import { GetSchoolArrivalsUseCase } from '../../domain/use-cases/get-school-arrivals.use-case';
import { NotifySchoolUseCase } from '../../domain/use-cases/notify-school.use-case';
import { DataModule } from '../../data/data.module';
import { OSRMModule } from '../../infrastructure/osrm/osrm.module';
import { WebSocketModule } from '../../infrastructure/websocket/websocket.module';
import { OSRMServiceAdapter } from '../../infrastructure/osrm/osrm-service.adapter';
import { LOCATION_REPOSITORY } from '../../domain/repositories/location.repository.interface';
import { SCHOOL_REPOSITORY } from '../../domain/repositories/school.repository.interface';
import { PARENT_REPOSITORY } from '../../domain/repositories/parent.repository.interface';
import { ETA_REPOSITORY } from '../../domain/repositories/eta.repository.interface';

@Module({
  imports: [DataModule, OSRMModule, WebSocketModule],
  controllers: [LocationsController],
  providers: [
    LocationsService,
    {
      provide: SaveLocationWithETAUseCase,
      useFactory: (
        locationRepo,
        schoolRepo,
        parentRepo,
        etaRepo,
        osrmService,
      ) =>
        new SaveLocationWithETAUseCase(
          locationRepo,
          schoolRepo,
          parentRepo,
          etaRepo,
          osrmService,
        ),
      inject: [
        LOCATION_REPOSITORY,
        SCHOOL_REPOSITORY,
        PARENT_REPOSITORY,
        ETA_REPOSITORY,
        OSRMServiceAdapter,
      ],
    },
    CalculateETAUseCase,
    GetArrivalsQueueUseCase,
    GetSchoolArrivalsUseCase,
    NotifySchoolUseCase,
    {
      provide: 'IOSRMServiceAdapter',
      useClass: OSRMServiceAdapter,
    },
  ],
})
export class LocationsModule {}
