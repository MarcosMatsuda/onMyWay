import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../repositories/parent.repository.interface';
import { Parent } from '../entities/parent.entity';

export interface ListSchoolParentsOutput {
  parents: Parent[];
}

@Injectable()
export class ListSchoolParentsUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
  ) {}

  async execute(schoolId: string): Promise<ListSchoolParentsOutput> {
    const school = await this.schoolRepository.findById(schoolId);

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const parents = await this.parentRepository.findBySchoolId(schoolId);

    return { parents };
  }
}
