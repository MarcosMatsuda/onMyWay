import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_CONSTANTS } from './jwt.constants';
import { JwtPayload } from './jwt-payload.interface';
import { Parent } from '../../domain/entities/parent.entity';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../../domain/repositories/parent.repository.interface';
import { Inject } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_CONSTANTS.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<Parent> {
    const { sub } = payload;
    const parent = await this.parentRepository.findById(sub);

    if (!parent) {
      throw new UnauthorizedException('User not found');
    }

    return parent;
  }
}
