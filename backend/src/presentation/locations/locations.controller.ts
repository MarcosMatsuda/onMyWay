import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  SaveLocationWithETAUseCase,
  SaveLocationWithETAInput,
  SaveLocationWithETAOutput,
} from '../../domain/use-cases/save-location-with-eta.use-case';
import {
  GetParentLocationsUseCase,
  GetParentLocationsInput,
  GetParentLocationsOutput,
} from '../../domain/use-cases/get-parent-locations.use-case';
import {
  CalculateETAUseCase,
  CalculateETAInput,
  CalculateETAOutput,
} from '../../domain/use-cases/calculate-eta.use-case';
import {
  GetArrivalsQueueUseCase,
  GetArrivalsQueueInput,
  GetArrivalsQueueOutput,
} from '../../domain/use-cases/get-arrivals-queue.use-case';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { SaveLocationDto } from './dtos/save-location.dto';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly saveLocationWithETAUseCase: SaveLocationWithETAUseCase,
    private readonly getParentLocationsUseCase: GetParentLocationsUseCase,
    private readonly calculateETAUseCase: CalculateETAUseCase,
    private readonly getArrivalsQueueUseCase: GetArrivalsQueueUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async saveLocation(
    @Request() req,
    @Body() saveLocationDto: SaveLocationDto,
  ): Promise<SaveLocationWithETAOutput> {
    const parentId = req.user.sub; // Get parentId from JWT token

    const input: SaveLocationWithETAInput = {
      parentId,
      lat: saveLocationDto.lat,
      lng: saveLocationDto.lng,
      schoolId: saveLocationDto.schoolId,
      accuracy: saveLocationDto.accuracy,
    };

    return this.saveLocationWithETAUseCase.execute(input);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyLocations(@Request() req): Promise<GetParentLocationsOutput> {
    const parentId = req.user.sub; // Get parentId from JWT token

    const input: GetParentLocationsInput = {
      parentId,
    };

    return this.getParentLocationsUseCase.execute(input);
  }

  @Post(':parentId/calculate-eta')
  @UseGuards(JwtAuthGuard)
  async calculateETA(
    @Param('parentId') parentId: string,
  ): Promise<CalculateETAOutput> {
    const input: CalculateETAInput = { parentId };
    return this.calculateETAUseCase.execute(input);
  }

  @Get('schools/:schoolId/arrivals-queue')
  @UseGuards(JwtAuthGuard)
  async getArrivalsQueue(
    @Param('schoolId') schoolId: string,
    @Query('limit') limit?: number,
  ): Promise<GetArrivalsQueueOutput> {
    const input: GetArrivalsQueueInput = {
      schoolId,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
    };
    return this.getArrivalsQueueUseCase.execute(input);
  }
}
