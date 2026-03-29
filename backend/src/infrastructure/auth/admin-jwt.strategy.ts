import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../../domain/entities/user.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub, role } = payload;

    // Cross-isolation: reject parent tokens
    if (!role || role === 'parent') {
      throw new UnauthorizedException('Invalid token for admin endpoint');
    }

    const user = await this.userRepository.findById(sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
