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
  NotFoundException,
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
import {
  CreateSchoolUseCase,
  CreateSchoolInput,
} from '../../domain/use-cases/create-school.use-case';
import { ListSchoolsUseCase } from '../../domain/use-cases/list-schools.use-case';
import { ArrivalDto } from './dtos/arrival.dto';
import { SchoolStatsDto, SchoolConfigDto } from './dtos/school-config.dto';
import { CreateSchoolDto } from './dtos/create-school.dto';
import {
  SchoolResponseDto,
  SchoolListResponseDto,
} from './dtos/school-response.dto';

@ApiTags('schools')
@Controller('schools')
export class SchoolsController {
  constructor(
    private readonly getSchoolArrivalsUseCase: GetSchoolArrivalsUseCase,
    private readonly getSchoolStatsUseCase: GetSchoolStatsUseCase,
    private readonly updateSchoolConfigUseCase: UpdateSchoolConfigUseCase,
    private readonly createSchoolUseCase: CreateSchoolUseCase,
    private readonly listSchoolsUseCase: ListSchoolsUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async createSchool(
    @Body() createSchoolDto: CreateSchoolDto,
  ): Promise<SchoolResponseDto> {
    const input: CreateSchoolInput = {
      name: createSchoolDto.name,
      lat: createSchoolDto.lat,
      lng: createSchoolDto.lng,
      geofenceRadiusMeters: createSchoolDto.geofenceRadiusMeters,
      notificationThresholdMeters: createSchoolDto.notificationThresholdMeters,
    };

    const result = await this.createSchoolUseCase.execute(input);

    return {
      id: result.id,
      name: result.name,
      lat: result.lat,
      lng: result.lng,
      geofenceRadiusMeters: result.geofenceRadiusMeters,
      notificationThresholdMeters: result.notificationThresholdMeters,
      createdAt: result.createdAt,
    };
  }

  @Get()
  async listSchools(): Promise<SchoolListResponseDto[]> {
    const result = await this.listSchoolsUseCase.execute();

    return result.schools.map((school) => ({
      id: school.id,
      name: school.name,
      location: {
        lat: school.lat,
        lng: school.lng,
      },
    }));
  }

  @Get(':id')
  async getSchool(
    @Param('id') schoolId: string,
  ): Promise<SchoolListResponseDto> {
    const result = await this.listSchoolsUseCase.execute();
    const school = result.schools.find((s) => s.id === schoolId);

    if (!school) {
      throw new NotFoundException(`School with id ${schoolId} not found`);
    }

    return {
      id: school.id,
      name: school.name,
      location: {
        lat: school.lat,
        lng: school.lng,
      },
    };
  }

  @Get(':id/arrivals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getArrivals(
    @Param('id') schoolId: string,
    @Query('limit') limit?: number,
  ): Promise<ArrivalDto[]> {
    const input: GetSchoolArrivalsInput = {
      schoolId,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
    };

    const result = await this.getSchoolArrivalsUseCase.execute(input);

    // Map to flat array of ArrivalDto (mobile expects array, not wrapper object)
    return result.arrivals.map((arrival) => ({
      parentId: arrival.parentId,
      distanceMeters: arrival.distanceMeters,
      durationMinutes: arrival.etaMinutes,
      routePolyline: arrival.routePolyline,
    }));
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
