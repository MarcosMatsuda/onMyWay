import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for OSRM service unavailability
 */
export class OSRMUnavailableError extends HttpException {
  constructor(message: string = 'OSRM routing service is unavailable') {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message,
        error: 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
