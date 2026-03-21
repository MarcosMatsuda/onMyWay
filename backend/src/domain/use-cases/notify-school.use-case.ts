import { GetSchoolArrivalsUseCase } from './get-school-arrivals.use-case';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { ETA } from '../entities/eta.entity';
import { ArrivalsGateway } from '../../infrastructure/websocket/arrivals.gateway';

export interface NotifySchoolInput {
  schoolId: string;
  parentId: string;
  eta: ETA;
}

export class NotifySchoolUseCase {
  constructor(
    private readonly getSchoolArrivalsUseCase: GetSchoolArrivalsUseCase,
    private readonly schoolRepository: ISchoolRepository,
    private readonly arrivalsGateway: ArrivalsGateway,
  ) {}

  async execute(input: NotifySchoolInput): Promise<void> {
    // Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Get updated arrivals queue
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
