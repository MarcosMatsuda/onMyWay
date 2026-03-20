import { IETARepository } from '../repositories/eta.repository.interface';
import { ISchoolRepository } from '../repositories/school.repository.interface';
import { IParentRepository } from '../repositories/parent.repository.interface';

export interface GetArrivalsQueueInput {
  schoolId: string;
  limit?: number;
}

export interface ArrivalInfo {
  parentId: string;
  parentName: string;
  etaMinutes: number;
  distanceMeters: number;
  calculatedAt: Date;
}

export interface GetArrivalsQueueOutput {
  arrivals: ArrivalInfo[];
  schoolName: string;
  totalCount: number;
}

export class GetArrivalsQueueUseCase {
  constructor(
    private readonly etaRepository: IETARepository,
    private readonly schoolRepository: ISchoolRepository,
    private readonly parentRepository: IParentRepository,
  ) {}

  async execute(input: GetArrivalsQueueInput): Promise<GetArrivalsQueueOutput> {
    // Validate school exists
    const school = await this.schoolRepository.findById(input.schoolId);
    if (!school) {
      throw new Error(`School with id ${input.schoolId} not found`);
    }

    // Get ETAs for this school
    const etas = await this.etaRepository.findBySchoolId(input.schoolId);

    // Enrich ETAs with parent information
    const arrivals = await Promise.all(
      etas.map(async (eta) => {
        const parent = await this.parentRepository.findById(eta.parentId);
        if (!parent) {
          throw new Error(`Parent with id ${eta.parentId} not found`);
        }

        return {
          parentId: eta.parentId,
          parentName: parent.name,
          etaMinutes: Math.round(eta.durationSeconds / 60),
          distanceMeters: eta.distanceMeters,
          calculatedAt: eta.calculatedAt,
        };
      }),
    );

    // Sort by ETA (ascending - soonest first)
    arrivals.sort((a, b) => a.etaMinutes - b.etaMinutes);

    // Apply limit if specified
    const limitedArrivals = input.limit
      ? arrivals.slice(0, input.limit)
      : arrivals;

    return {
      arrivals: limitedArrivals,
      schoolName: school.name,
      totalCount: arrivals.length,
    };
  }
}
