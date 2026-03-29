import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminLoginDto } from './dtos/admin-login.dto';
import { AdminAuthResponseDto } from './dtos/admin-auth-response.dto';
import { User } from '@domain/entities';
import { IUserRepository, USER_REPOSITORY } from '@domain/repositories';
import { JwtPayload } from '@infrastructure/auth/jwt-payload.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    const user = await this.userRepository.validateCredentials(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);

    return new AdminAuthResponseDto(accessToken, refreshToken, user);
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private generateTokens(user: User): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ?? null,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }
}
