import { Injectable } from '@nestjs/common';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { School } from '../entities/school.entity';

export interface ListSchoolsOutput {
  schools: School[];
}

@Injectable()
export class ListSchoolsUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  async execute(): Promise<ListSchoolsOutput> {
    const schools = await this.schoolRepository.findAll();
    return { schools };
  }
}
