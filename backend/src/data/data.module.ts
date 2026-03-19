import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentModel } from './models/parent.model';
import { SchoolModel } from './models/school.model';
import { ParentRepository } from './repositories/parent.repository';
import { SchoolRepository } from './repositories/school.repository';
import { PARENT_REPOSITORY } from '../domain/repositories/parent.repository.interface';
import { SCHOOL_REPOSITORY } from '../domain/repositories/school.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ParentModel, SchoolModel])],
  providers: [
    {
      provide: PARENT_REPOSITORY,
      useClass: ParentRepository,
    },
    {
      provide: SCHOOL_REPOSITORY,
      useClass: SchoolRepository,
    },
  ],
  exports: [PARENT_REPOSITORY, SCHOOL_REPOSITORY],
})
export class DataModule {}
