import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../repositories/user.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import { User } from '../entities/user.entity';
import { NotFoundException } from '@nestjs/common';

export interface CreateSchoolAdminInput {
  name: string;
  email: string;
  password: string;
  schoolId: string;
}

@Injectable()
export class CreateSchoolAdminUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
  ) {}

  async execute(input: CreateSchoolAdminInput): Promise<User> {
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new NotFoundException(`School with ID ${input.schoolId} not found`);
    }

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException(
        `User with email ${input.email} already exists`,
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return this.userRepository.create({
      name: input.name,
      email: input.email,
      role: 'school_admin',
      schoolId: input.schoolId,
      passwordHash,
    });
  }
}
