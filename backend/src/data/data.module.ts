import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentModel } from './models/parent.model';
import { ParentRepository } from './repositories/parent.repository';
import { PARENT_REPOSITORY } from '../domain/repositories/parent.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([ParentModel])],
  providers: [
    {
      provide: PARENT_REPOSITORY,
      useClass: ParentRepository,
    },
  ],
  exports: [PARENT_REPOSITORY],
})
export class DataModule {}
