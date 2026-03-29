import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { AdminAuthResponseDto } from './dtos/admin-auth-response.dto';
import { User } from '@domain/entities';
import { AdminJwtAuthGuard } from '@infrastructure/auth/admin-jwt-auth.guard';

@ApiTags('admin-auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Admin login',
    description: 'Authenticate admin user and receive JWT token',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    return this.adminAuthService.login(loginDto);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get authenticated admin profile',
    description: 'Retrieve current admin user profile data',
  })
  @ApiBearerAuth()
  @UseGuards(AdminJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req): Promise<User> {
    return this.adminAuthService.getProfile(req.user.id);
  }
}
