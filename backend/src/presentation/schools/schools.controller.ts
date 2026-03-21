import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import {
  GetSchoolArrivalsUseCase,
  GetSchoolArrivalsInput,
} from '../../domain/use-cases/get-school-arrivals.use-case';
import {
  GetSchoolStatsUseCase,
  GetSchoolStatsInput,
} from '../../domain/use-cases/get-school-stats.use-case';
import {
  UpdateSchoolConfigUseCase,
  UpdateSchoolConfigInput,
} from '../../domain/use-cases/update-school-config.use-case';
import { ArrivalsResponseDto } from './dtos/arrival.dto';
import { SchoolStatsDto, SchoolConfigDto } from './dtos/school-config.dto';

@ApiTags('schools')
@ApiBearerAuth()
@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolsController {
  constructor(
    private readonly getSchoolArrivalsUseCase: GetSchoolArrivalsUseCase,
    private readonly getSchoolStatsUseCase: GetSchoolStatsUseCase,
    private readonly updateSchoolConfigUseCase: UpdateSchoolConfigUseCase,
  ) {}

  @Get(':id/arrivals')
  async getArrivals(
    @Param('id') schoolId: string,
    @Query('limit') limit?: number,
  ): Promise<ArrivalsResponseDto> {
    const input: GetSchoolArrivalsInput = {
      schoolId,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
    };

    const result = await this.getSchoolArrivalsUseCase.execute(input);

    // Map to DTO
    return {
      schoolName: result.schoolName,
      totalCount: result.totalCount,
      arrivals: result.arrivals.map((arrival) => ({
        parentId: arrival.parentId,
        parentName: arrival.parentName,
        lat: arrival.lat,
        lng: arrival.lng,
        etaMinutes: arrival.etaMinutes,
        distanceMeters: arrival.distanceMeters,
        calculatedAt: arrival.calculatedAt,
      })),
    };
  }

  @Get(':id/stats')
  async getStats(@Param('id') schoolId: string): Promise<SchoolStatsDto> {
    const input: GetSchoolStatsInput = { schoolId };
    const result = await this.getSchoolStatsUseCase.execute(input);

    return {
      totalParents: result.totalParents,
      avgETA: result.avgETA,
      etaLessThan5Min: result.etaLessThan5Min,
      eta5To15Min: result.eta5To15Min,
      etaGreaterThan15Min: result.etaGreaterThan15Min,
    };
  }

  @Post(':id/config')
  @HttpCode(HttpStatus.OK)
  async updateConfig(
    @Param('id') schoolId: string,
    @Body() configDto: SchoolConfigDto,
  ): Promise<SchoolConfigDto> {
    const input: UpdateSchoolConfigInput = {
      schoolId,
      geofenceRadiusMeters: configDto.geofenceRadiusMeters,
      notificationThresholdMeters: configDto.notificationThresholdMeters,
    };

    const result = await this.updateSchoolConfigUseCase.execute(input);

    return {
      geofenceRadiusMeters: result.geofenceRadiusMeters,
      notificationThresholdMeters: result.notificationThresholdMeters,
    };
  }
}
