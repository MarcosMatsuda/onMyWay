import { Injectable, Inject, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  OSRMRouteRequest,
  OSRMRouteResponse,
  OSRMRouteResult,
  OSRMConfig,
} from './osrm.types';
import { OSRMUnavailableError } from './osrm-unavailable.error';

/**
 * OSRM Service for route calculation and ETA
 */
@Injectable()
export class OSRMService {
  private readonly logger = new Logger(OSRMService.name);
  private readonly httpClient: AxiosInstance;

  constructor(@Inject('OSRM_CONFIG') private readonly config: OSRMConfig) {
    const baseUrl = config.baseUrl || 'http://router.project-osrm.org';
    const timeout = config.timeout || 10000; // 10 seconds default timeout

    this.httpClient = axios.create({
      baseURL: baseUrl,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'onMyWay-Backend/0.1.0',
      },
    });

    this.logger.log(`OSRM service initialized with base URL: ${baseUrl}`);
  }

  /**
   * Calculate route between two points
   * @param fromLat - Starting latitude
   * @param fromLng - Starting longitude
   * @param toLat - Destination latitude
   * @param toLng - Destination longitude
   * @returns Route result with distance, duration, and polyline
   * @throws OSRMUnavailableError when OSRM API is unavailable or returns error
   */
  async calculateRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<OSRMRouteResult> {
    const request: OSRMRouteRequest = { fromLat, fromLng, toLat, toLng };

    try {
      this.logger.debug(
        `Calculating route from (${fromLat}, ${fromLng}) to (${toLat}, ${toLng})`,
      );

      const response = await this.httpClient.get<OSRMRouteResponse>(
        `/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}`,
        {
          params: {
            overview: 'full',
            geometries: 'polyline',
            alternatives: false,
            steps: false,
          },
        },
      );

      if (response.data.code !== 'Ok' || !response.data.routes?.length) {
        this.logger.error(
          `OSRM API returned error: ${response.data.code}`,
          JSON.stringify(response.data),
        );
        throw new OSRMUnavailableError(
          `OSRM routing failed with code: ${response.data.code}`,
        );
      }

      const route = response.data.routes[0];
      const result: OSRMRouteResult = {
        distanceMeters: Math.round(route.distance),
        durationSeconds: Math.round(route.duration),
        polyline: route.geometry,
      };

      this.logger.debug(
        `Route calculated: ${result.distanceMeters}m, ${result.durationSeconds}s`,
      );

      return result;
    } catch (error) {
      this.handleOSRMError(error, request);
    }
  }

  /**
   * Handle OSRM API errors
   * @param error - The caught error
   * @param request - The route request that failed
   * @throws OSRMUnavailableError
   */
  private handleOSRMError(error: any, request: OSRMRouteRequest): never {
    if (error instanceof AxiosError) {
      if (error.code === 'ECONNABORTED') {
        this.logger.error(`OSRM API timeout for request:`, request);
        throw new OSRMUnavailableError(`OSRM routing service timeout`);
      }

      if (error.response) {
        this.logger.error(
          `OSRM API returned HTTP ${error.response.status}:`,
          error.response.data,
        );
        throw new OSRMUnavailableError(
          `OSRM routing service returned HTTP ${error.response.status}`,
        );
      }

      if (error.request) {
        this.logger.error(
          'No response received from OSRM API. Network error:',
          error.message,
        );
        throw new OSRMUnavailableError('OSRM routing service is unreachable');
      }
    }

    this.logger.error(
      'Unexpected error in OSRM service:',
      error.message || error,
    );
    throw new OSRMUnavailableError('Unexpected error in routing service');
  }

  /**
   * Get service health status
   * @returns Promise resolving to true if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - try to get a route between two close points
      await this.httpClient.get('/route/v1/driving/0,0;0.001,0.001', {
        params: { overview: 'false' },
        timeout: 5000, // Shorter timeout for health check
      });
      return true;
    } catch (error) {
      this.logger.warn('OSRM health check failed:', error.message);
      return false;
    }
  }
}
