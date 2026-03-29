import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';

export interface GetSchoolInviteOutput {
  schoolId: string;
  inviteCode: string;
}

@Injectable()
export class GetSchoolInviteUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(schoolId: string): Promise<GetSchoolInviteOutput> {
    const school = await this.schoolRepository.findById(schoolId);

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    return {
      schoolId: school.id,
      inviteCode: school.inviteCode,
    };
  }
}
