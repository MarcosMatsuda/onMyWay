import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentModel } from './models/parent.model';
import { SchoolModel } from './models/school.model';
import { LocationModel } from './models/location.model';
import { ETAModel } from './models/eta.model';
import { ParentRepository } from './repositories/parent.repository';
import { SchoolRepository } from './repositories/school.repository';
import { LocationRepository } from './repositories/location.repository';
import { ETARepository } from './repositories/eta.repository';
import { PARENT_REPOSITORY } from '../domain/repositories/parent.repository.interface';
import { SCHOOL_REPOSITORY } from '../domain/repositories/school.repository.interface';
import { LOCATION_REPOSITORY } from '../domain/repositories/location.repository.interface';
import { ETA_REPOSITORY } from '../domain/repositories/eta.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParentModel,
      SchoolModel,
      LocationModel,
      ETAModel,
    ]),
  ],
  providers: [
    {
      provide: PARENT_REPOSITORY,
      useClass: ParentRepository,
    },
    {
      provide: SCHOOL_REPOSITORY,
      useClass: SchoolRepository,
    },
    {
      provide: LOCATION_REPOSITORY,
      useClass: LocationRepository,
    },
    {
      provide: ETA_REPOSITORY,
      useClass: ETARepository,
    },
  ],
  exports: [
    PARENT_REPOSITORY,
    SCHOOL_REPOSITORY,
    LOCATION_REPOSITORY,
    ETA_REPOSITORY,
  ],
})
export class DataModule {}
