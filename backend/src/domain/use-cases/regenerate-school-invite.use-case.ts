import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';

export interface RegenerateSchoolInviteOutput {
  schoolId: string;
  inviteCode: string;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('');
}

@Injectable()
export class RegenerateSchoolInviteUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(schoolId: string): Promise<RegenerateSchoolInviteOutput> {
    const school = await this.schoolRepository.findById(schoolId);

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    const newInviteCode = generateInviteCode();
    const updated = await this.schoolRepository.update(schoolId, {
      inviteCode: newInviteCode,
    });

    return {
      schoolId: updated.id,
      inviteCode: updated.inviteCode,
    };
  }
}
