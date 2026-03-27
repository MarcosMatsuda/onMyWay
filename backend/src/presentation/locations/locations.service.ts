import { Injectable, Inject, Logger } from '@nestjs/common';
import { SaveLocationWithETAUseCase } from '../../domain/use-cases/save-location-with-eta.use-case';
import { NotifySchoolUseCase } from '../../domain/use-cases/notify-school.use-case';
import { StopSharingUseCase } from '../../domain/use-cases/stop-sharing.use-case';
import {
  ILocationRepository,
  LOCATION_REPOSITORY,
} from '../../domain/repositories/location.repository.interface';
import {
  IETARepository,
  ETA_REPOSITORY,
} from '../../domain/repositories/eta.repository.interface';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../../domain/repositories/parent.repository.interface';
import { CreateLocationDto } from './dtos/create-location.dto';
import { LocationResponseDto } from './dtos/location-response.dto';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    private readonly saveLocationWithETAUseCase: SaveLocationWithETAUseCase,
    private readonly notifySchoolUseCase: NotifySchoolUseCase,
    private readonly stopSharingUseCase: StopSharingUseCase,
    @Inject(LOCATION_REPOSITORY)
    private readonly locationRepository: ILocationRepository,
    @Inject(ETA_REPOSITORY)
    private readonly etaRepository: IETARepository,
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
  ) {}

  async saveLocation(
    parentId: string,
    createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    // First, get the parent to determine their school
    // Note: SaveLocationWithETAUseCase requires schoolId upfront
    // In production, the parent's school should be retrieved from the request context or parent repo
    // For now, we'll handle this in the use case validation

    // Use SaveLocationWithETAUseCase which handles both location save + ETA in one flow
    // We need to get the parent's schoolId first
    const parent = await this.getParentWithSchool(parentId);

    const output = await this.saveLocationWithETAUseCase.execute({
      parentId,
      lat: createLocationDto.lat,
      lng: createLocationDto.lng,
      accuracy: createLocationDto.accuracy,
      schoolId: parent.schoolId,
    });

    // Build response
    const response: LocationResponseDto = {
      id: output.location.id,
      parentId: output.location.parentId,
      lat: output.location.lat,
      lng: output.location.lng,
      accuracy: output.location.accuracy,
      timestamp: output.location.timestamp,
      isWithinGeofence: output.isWithinGeofence,
      eta: {
        id: output.eta.id,
        durationSeconds: output.eta.durationSeconds,
        distanceMeters: output.eta.distanceMeters,
        routePolyline: output.eta.routePolyline,
        calculatedAt: output.eta.calculatedAt,
      },
    };

    // Emit WebSocket event after saving location with ETA
    await this.emitArrivalsUpdate(parentId, output.eta.schoolId);

    return response;
  }

  private async getParentWithSchool(
    parentId: string,
  ): Promise<{ schoolId: string }> {
    // First try to get parent to get their school directly
    const parent = await this.parentRepository.findById(parentId);
    if (parent && parent.schoolId) {
      return { schoolId: parent.schoolId };
    }

    // Fallback: Try to get school from latest ETA
    const latestETA = await this.etaRepository.findLatestByParentId(parentId);
    if (latestETA) {
      return { schoolId: latestETA.schoolId };
    }

    // Cannot determine school
    throw new Error(
      `Cannot determine school for parent ${parentId}. Please ensure parent has an associated school.`,
    );
  }

  private async emitArrivalsUpdate(
    parentId: string,
    schoolId: string,
  ): Promise<void> {
    try {
      // Get latest ETA for the parent (just saved by SaveLocationWithETAUseCase)
      const eta = await this.etaRepository.findLatestByParentId(parentId);
      if (!eta) {
        this.logger.warn(
          `No ETA found for parent ${parentId} after location save`,
        );
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

  async stopSharing(parentId: string): Promise<void> {
    try {
      // Get parent's school
      const parent = await this.getParentWithSchool(parentId);

      // Execute stop sharing use case
      await this.stopSharingUseCase.execute({
        parentId,
        schoolId: parent.schoolId,
      });

      this.logger.log(
        `Parent ${parentId} stopped sharing location for school ${parent.schoolId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to stop sharing: ${error.message}`);
      throw error;
    }
  }
}
