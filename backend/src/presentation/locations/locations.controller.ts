import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
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
import { JwtPayload } from '../../infrastructure/auth/jwt-payload.interface';
import { CreateLocationDto } from './dtos/create-location.dto';
import { LocationResponseDto } from './dtos/location-response.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly calculateETAUseCase: CalculateETAUseCase,
    private readonly getArrivalsQueueUseCase: GetArrivalsQueueUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Save parent location',
    description: 'Update parent location coordinates',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async saveLocation(
    @Request() req: { user: JwtPayload },
    @Body() createLocationDto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    const parentId = req.user.sub;
    return this.locationsService.saveLocation(parentId, createLocationDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get my latest location',
    description: 'Retrieve current location and ETA information',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getMyLatestLocation(
    @Request() req: { user: JwtPayload },
  ): Promise<LocationResponseDto | null> {
    const parentId = req.user.sub;
    return this.locationsService.getMyLatestLocation(parentId);
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
