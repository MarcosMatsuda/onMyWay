import { Injectable, Inject } from '@nestjs/common';
import {
  IETARepository,
  ETA_REPOSITORY,
} from '../repositories/eta.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../repositories/school.repository.interface';
import { GetSchoolArrivalsUseCase } from './get-school-arrivals.use-case';
import { ArrivalsGateway } from '../../infrastructure/websocket/arrivals.gateway';

export interface StopSharingInput {
  parentId: string;
  schoolId: string;
}

export interface StopSharingOutput {
  deleted: boolean;
}

@Injectable()
export class StopSharingUseCase {
  constructor(
    @Inject(ETA_REPOSITORY)
    private readonly etaRepository: IETARepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
    private readonly getSchoolArrivalsUseCase: GetSchoolArrivalsUseCase,
    private readonly arrivalsGateway: ArrivalsGateway,
  ) {}

  async execute(input: StopSharingInput): Promise<StopSharingOutput> {
    // Delete all ETA records for the parent
    await this.etaRepository.deleteByParentId(input.parentId);

    // Notify school via WebSocket if schoolId is provided
    if (input.schoolId) {
      const school = await this.schoolRepository.findById(input.schoolId);
      if (school) {
        // Get updated arrivals queue (parent should no longer be included)
        const arrivalsOutput = await this.getSchoolArrivalsUseCase.execute({
          schoolId: input.schoolId,
        });

        // Emit WebSocket event to school room
        this.arrivalsGateway.emitArrivalsUpdated(
          input.schoolId,
          arrivalsOutput.arrivals,
          school.name,
        );
      }
    }

    return { deleted: true };
  }
}
