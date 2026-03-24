import { ETA } from '@domain/entities';
import { ISchoolRepository } from '@domain/repositories';

export class GetArrivalsUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  async execute(schoolId: string): Promise<ETA[]> {
    return this.schoolRepository.getArrivalsQueue(schoolId);
  }
}
