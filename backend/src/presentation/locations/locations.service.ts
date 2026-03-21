import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  SaveLocationUseCase,
  SaveLocationInput,
} from '../../domain/use-cases/save-location.use-case';
import {
  CalculateETAUseCase,
  CalculateETAInput,
  CalculateETAOutput,
} from '../../domain/use-cases/calculate-eta.use-case';
import { GetSchoolArrivalsUseCase } from '../../domain/use-cases/get-school-arrivals.use-case';
import { NotifySchoolUseCase } from '../../domain/use-cases/notify-school.use-case';
import { ILocationRepository } from '../../domain/repositories/location.repository.interface';
import { IETARepository } from '../../domain/repositories/eta.repository.interface';
import { IParentRepository } from '../../domain/repositories/parent.repository.interface';
import { ISchoolRepository } from '../../domain/repositories/school.repository.interface';
import { CreateLocationDto } from './dtos/create-location.dto';
import { LocationResponseDto } from './dtos/location-response.dto';
import { LOCATION_REPOSITORY } from '../../domain/repositories/location.repository.interface';
import { ETA_REPOSITORY } from '../../domain/repositories/eta.repository.interface';
import { PARENT_REPOSITORY } from '../../domain/repositories/parent.repository.interface';
import { SCHOOL_REPOSITORY } from '../../domain/repositories/school.repository.interface';
import { ArrivalsGateway } from '../../infrastructure/websocket/arrivals.gateway';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly saveLocationUseCase: SaveLocationUseCase,
    private readonly calculateETAUseCase: CalculateETAUseCase,
    private readonly getSchoolArrivalsUseCase: GetSchoolArrivalsUseCase,
    private readonly notifySchoolUseCase: NotifySchoolUseCase,
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
    @Inject(ETA_REPOSITORY)
    private readonly etaRepository: IETARepository,
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
    private readonly arrivalsGateway: ArrivalsGateway,
  ) {}

  async saveLocation(
    parentId: string,
    createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    // Save location
    const saveLocationInput: SaveLocationInput = {
      parentId,
      lat: createLocationDto.lat,
      lng: createLocationDto.lng,
      accuracy: createLocationDto.accuracy,
    };

    const saveLocationOutput =
      await this.saveLocationUseCase.execute(saveLocationInput);

    // Calculate ETA
    const calculateETAInput: CalculateETAInput = { parentId };
    let calculateETAOutput: CalculateETAOutput | null = null;
    let schoolId: string | null = null;

    try {
      calculateETAOutput =
        await this.calculateETAUseCase.execute(calculateETAInput);
      if (calculateETAOutput) {
        schoolId = calculateETAOutput.eta.schoolId;
      }
    } catch (error) {
      // ETA calculation might fail if school not found or OSRM service unavailable
      this.logger.warn('ETA calculation failed:', error.message);
      // Still try to get schoolId from parent to emit update
      const parent = await this.parentRepository.findById(parentId);
      if (parent) {
        schoolId = parent.schoolId;
      }
    }

    // Build response
    const response: LocationResponseDto = {
      id: saveLocationOutput.location.id,
      parentId: saveLocationOutput.location.parentId,
      lat: saveLocationOutput.location.lat,
      lng: saveLocationOutput.location.lng,
      accuracy: saveLocationOutput.location.accuracy,
      timestamp: saveLocationOutput.location.timestamp,
      isWithinGeofence: saveLocationOutput.isWithinGeofence,
    };

    if (calculateETAOutput) {
      response.eta = {
        id: calculateETAOutput.eta.id,
        durationSeconds: calculateETAOutput.eta.durationSeconds,
        distanceMeters: calculateETAOutput.eta.distanceMeters,
        routePolyline: calculateETAOutput.eta.routePolyline,
        calculatedAt: calculateETAOutput.eta.calculatedAt,
      };
    }

    // Emit WebSocket event after saving location (with or without successful ETA)
    if (schoolId) {
      await this.emitArrivalsUpdate(parentId, schoolId);
    }

    return response;
  }

  private async emitArrivalsUpdate(
    parentId: string,
    schoolId: string,
  ): Promise<void> {
    try {
      // Get latest ETA for the parent
      const eta = await this.etaRepository.findLatestByParentId(parentId);
      if (!eta) {
        this.logger.warn(`No ETA found for parent ${parentId}`);
        return;
      }

      // Use NotifySchoolUseCase to encapsulate the notification business logic
      await this.notifySchoolUseCase.execute({
        schoolId,
        parentId,
        eta,
      });

      this.logger.debug(
        `Notified school ${schoolId} about location update from parent ${parentId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to notify school: ${error.message}`);
      // Don't throw - this is a side effect and shouldn't break the location save
    }
  }

  async getMyLatestLocation(
    parentId: string,
  ): Promise<LocationResponseDto | null> {
    // Get latest location
    const location =
      await this.locationRepository.findLatestByParentId(parentId);
    if (!location) {
      return null;
    }

    // Get latest ETA
    const eta = await this.etaRepository.findLatestByParentId(parentId);

    // Build response
    const response: LocationResponseDto = {
      id: location.id,
      parentId: location.parentId,
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy,
      timestamp: location.timestamp,
      isWithinGeofence: false, // We don't have this info without calling saveLocationUseCase
    };

    if (eta) {
      response.eta = {
        id: eta.id,
        durationSeconds: eta.durationSeconds,
        distanceMeters: eta.distanceMeters,
        routePolyline: eta.routePolyline,
        calculatedAt: eta.calculatedAt,
      };
    }

    return response;
  }
}
