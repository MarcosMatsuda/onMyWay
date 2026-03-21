import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { GetSchoolArrivalsUseCase } from '../../domain/use-cases/get-school-arrivals.use-case';
import { GetSchoolStatsUseCase } from '../../domain/use-cases/get-school-stats.use-case';
import { UpdateSchoolConfigUseCase } from '../../domain/use-cases/update-school-config.use-case';
import { CreateSchoolUseCase } from '../../domain/use-cases/create-school.use-case';
import { ListSchoolsUseCase } from '../../domain/use-cases/list-schools.use-case';
import { DataModule } from '../../data/data.module';

@Module({
  imports: [DataModule],
  controllers: [SchoolsController],
  providers: [
    GetSchoolArrivalsUseCase,
    GetSchoolStatsUseCase,
    UpdateSchoolConfigUseCase,
    CreateSchoolUseCase,
    ListSchoolsUseCase,
  ],
})
export class SchoolsModule {}
