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
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { Parent } from '../../domain/entities/parent.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new parent account',
    description: 'Create new parent account in the system',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login parent account',
    description: 'Authenticate parent and receive JWT token',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @ApiOperation({
    summary: 'Get authenticated parent profile',
    description: 'Retrieve current parent profile data',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req): Promise<Parent> {
    return this.authService.getProfile(req.user.id);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout parent account',
    description: 'Logout parent (stateless JWT, no server-side blacklist)',
  })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<Record<string, never>> {
    // Stateless logout - just validate the request format
    // JWT validation happens on client side when making protected requests
    return {};
  }
}
