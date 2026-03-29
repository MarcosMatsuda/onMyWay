import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class ListSchoolAdminsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(schoolId: string): Promise<{ admins: User[] }> {
    const school = await this.schoolRepository.findById(schoolId);
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const admins = await this.userRepository.findBySchoolId(schoolId);
    return { admins };
  }
}
