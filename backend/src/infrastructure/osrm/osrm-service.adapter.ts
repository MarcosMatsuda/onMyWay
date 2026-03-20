import { Injectable } from '@nestjs/common';
import { OSRMService } from './osrm.service';
import { IOSRMServiceAdapter } from '../../domain/use-cases/calculate-eta.use-case';

@Injectable()
export class OSRMServiceAdapter implements IOSRMServiceAdapter {
  constructor(private readonly osrmService: OSRMService) {}

  async calculateRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<{
    distanceMeters: number;
    durationSeconds: number;
    polyline: string;
  }> {
    const result = await this.osrmService.calculateRoute(
      fromLat,
      fromLng,
      toLat,
      toLng,
    );

    return {
      distanceMeters: result.distanceMeters,
      durationSeconds: result.durationSeconds,
      polyline: result.polyline,
    };
  }
}
