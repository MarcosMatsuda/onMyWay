import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global All Exceptions Filter
 * Catches all unhandled exceptions and returns structured JSON
 * Never exposes stack traces in production
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : 'Internal server error';
    const isProduction = process.env.NODE_ENV === 'production';

    // Log full error with stack trace (only used for debugging)
    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception: ${request.method} ${request.url}`,
        exception.stack,
      );
    } else {
      this.logger.error(
        `Unhandled Exception: ${request.method} ${request.url}`,
        String(exception),
      );
    }

    const errorResponse: any = {
      statusCode,
      message: isProduction ? 'Internal server error' : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Never expose stack trace in production
    if (!isProduction && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(statusCode).json(errorResponse);
  }
}
