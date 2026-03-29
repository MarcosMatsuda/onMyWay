import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../repositories/parent.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';

@Injectable()
export class RemoveSchoolParentUseCase {
  constructor(
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(schoolId: string, parentId: string): Promise<void> {
    const school = await this.schoolRepository.findById(schoolId);
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const parent = await this.parentRepository.findById(parentId);
    if (!parent) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    if (parent.schoolId !== schoolId) {
      throw new NotFoundException(`Parent with ID ${parentId} not found`);
    }

    await this.parentRepository.delete(parentId);
  }
}
