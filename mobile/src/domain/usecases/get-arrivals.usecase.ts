import { ISchoolRepository } from '@domain/repositories';
import { ETA } from '@domain/entities';

/**
 * GetArrivalsUseCase
 * Retrieves the current arrivals queue for a school
 */
export class GetArrivalsUseCase {
  constructor(private readonly schoolRepository: ISchoolRepository) {}

  async execute(schoolId: string): Promise<ETA[]> {
    return this.schoolRepository.getArrivalsQueue(schoolId);
  }
}
