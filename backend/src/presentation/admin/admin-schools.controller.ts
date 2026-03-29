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
import { AdminJwtAuthGuard } from '../../infrastructure/auth/admin-jwt-auth.guard';
import { RolesGuard } from '../../infrastructure/auth/roles.guard';
import { SchoolAccessGuard } from '../../infrastructure/auth/school-access.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { ListSchoolsUseCase } from '../../domain/use-cases/list-schools.use-case';
import {
  CreateSchoolUseCase,
  CreateSchoolInput,
} from '../../domain/use-cases/create-school.use-case';
import { GetSchoolUseCase } from '../../domain/use-cases/get-school.use-case';
import { GetSchoolInviteUseCase } from '../../domain/use-cases/get-school-invite.use-case';
import { RegenerateSchoolInviteUseCase } from '../../domain/use-cases/regenerate-school-invite.use-case';
import { ListSchoolParentsUseCase } from '../../domain/use-cases/list-school-parents.use-case';
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
import { ArrivalDto } from '../schools/dtos/arrival.dto';
import {
  SchoolStatsDto,
  SchoolConfigDto,
} from '../schools/dtos/school-config.dto';
import { CreateSchoolDto } from '../schools/dtos/create-school.dto';
import {
  SchoolResponseDto,
  SchoolListResponseDto,
} from '../schools/dtos/school-response.dto';

@ApiTags('admin/schools')
@Controller('admin/schools')
@UseGuards(AdminJwtAuthGuard, RolesGuard)
@ApiBearerAuth('admin-jwt')
export class AdminSchoolsController {
  constructor(
    private readonly listSchoolsUseCase: ListSchoolsUseCase,
    private readonly createSchoolUseCase: CreateSchoolUseCase,
    private readonly getSchoolUseCase: GetSchoolUseCase,
    private readonly getSchoolInviteUseCase: GetSchoolInviteUseCase,
    private readonly regenerateSchoolInviteUseCase: RegenerateSchoolInviteUseCase,
    private readonly listSchoolParentsUseCase: ListSchoolParentsUseCase,
    private readonly getSchoolArrivalsUseCase: GetSchoolArrivalsUseCase,
    private readonly getSchoolStatsUseCase: GetSchoolStatsUseCase,
    private readonly updateSchoolConfigUseCase: UpdateSchoolConfigUseCase,
  ) {}

  @Get()
  @Roles('super_admin')
  async listSchools(): Promise<SchoolListResponseDto[]> {
    const result = await this.listSchoolsUseCase.execute();

    return result.schools.map((school) => ({
      id: school.id,
      name: school.name,
      location: {
        lat: school.lat,
        lng: school.lng,
      },
      geofenceRadiusMeters: school.geofenceRadiusMeters,
      notificationThresholdMeters: school.notificationThresholdMeters,
    }));
  }

  @Post()
  @Roles('super_admin')
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

  @Get(':schoolId')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  async getSchool(
    @Param('schoolId') schoolId: string,
  ): Promise<SchoolListResponseDto> {
    const school = await this.getSchoolUseCase.execute(schoolId);

    return {
      id: school.id,
      name: school.name,
      location: {
        lat: school.lat,
        lng: school.lng,
      },
      geofenceRadiusMeters: school.geofenceRadiusMeters,
      notificationThresholdMeters: school.notificationThresholdMeters,
    };
  }

  @Get(':schoolId/arrivals')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  async getArrivals(
    @Param('schoolId') schoolId: string,
    @Query('limit') limit?: number,
  ): Promise<ArrivalDto[]> {
    const input: GetSchoolArrivalsInput = {
      schoolId,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
    };

    const result = await this.getSchoolArrivalsUseCase.execute(input);

    return result.arrivals.map((arrival) => ({
      parentId: arrival.parentId,
      distanceMeters: arrival.distanceMeters,
      durationMinutes: arrival.etaMinutes,
      routePolyline: arrival.routePolyline,
    }));
  }

  @Get(':schoolId/stats')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  async getStats(@Param('schoolId') schoolId: string): Promise<SchoolStatsDto> {
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

  @Post(':schoolId/config')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  @HttpCode(HttpStatus.OK)
  async updateConfig(
    @Param('schoolId') schoolId: string,
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

  @Get(':schoolId/invite')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  async getInvite(
    @Param('schoolId') schoolId: string,
  ): Promise<{ inviteCode: string }> {
    const result = await this.getSchoolInviteUseCase.execute(schoolId);

    return {
      inviteCode: result.inviteCode,
    };
  }

  @Post(':schoolId/regenerate-invite')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  @HttpCode(HttpStatus.OK)
  async regenerateInvite(
    @Param('schoolId') schoolId: string,
  ): Promise<{ inviteCode: string }> {
    const result = await this.regenerateSchoolInviteUseCase.execute(schoolId);

    return {
      inviteCode: result.inviteCode,
    };
  }

  @Get(':schoolId/parents')
  @Roles('super_admin', 'school_admin')
  @UseGuards(SchoolAccessGuard)
  async listParents(
    @Param('schoolId') schoolId: string,
  ): Promise<{ id: string; name: string; email: string; phone: string; createdAt: Date }[]> {
    const result = await this.listSchoolParentsUseCase.execute(schoolId);

    return result.parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      createdAt: parent.createdAt,
    }));
  }
}
