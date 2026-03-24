import { Injectable, Inject } from '@nestjs/common';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';

export interface ListSchoolsOutput {
  schools: School[];
}

@Injectable()
export class ListSchoolsUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(): Promise<ListSchoolsOutput> {
    const schools = await this.schoolRepository.findAll();
    return { schools };
  }
}
