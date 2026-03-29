import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';

@Injectable()
export class GetSchoolUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(schoolId: string): Promise<School> {
    const school = await this.schoolRepository.findById(schoolId);

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    return school;
  }
}
