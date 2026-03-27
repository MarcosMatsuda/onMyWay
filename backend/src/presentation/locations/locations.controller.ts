import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  SaveLocationUseCase,
  SaveLocationInput,
  SaveLocationOutput,
} from '../../domain/use-cases/save-location.use-case';
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

@Controller('locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(
    private readonly saveLocationUseCase: SaveLocationUseCase,
    private readonly calculateETAUseCase: CalculateETAUseCase,
    private readonly getArrivalsQueueUseCase: GetArrivalsQueueUseCase,
  ) {}

  @Post()
  async saveLocation(
    @Body() input: SaveLocationInput,
  ): Promise<SaveLocationOutput> {
    return this.saveLocationUseCase.execute(input);
  }

  @Post(':parentId/calculate-eta')
  async calculateETA(
    @Param('parentId') parentId: string,
  ): Promise<CalculateETAOutput> {
    const input: CalculateETAInput = { parentId };
    return this.calculateETAUseCase.execute(input);
  }

  @Get('schools/:schoolId/arrivals-queue')
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
