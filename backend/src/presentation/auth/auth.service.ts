import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { Parent } from '../../domain/entities/parent.entity';
import {
  IParentRepository,
  PARENT_REPOSITORY,
} from '../../domain/repositories/parent.repository.interface';
import {
  ISchoolRepository,
  SCHOOL_REPOSITORY,
} from '../../domain/repositories/school.repository.interface';
import { JwtPayload } from '../../infrastructure/auth/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: ISchoolRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingParent = await this.parentRepository.findByEmail(
      registerDto.email,
    );
    if (existingParent) {
      throw new ConflictException('Email already registered');
    }

    // Validate school exists if provided
    if (registerDto.schoolId) {
      const school = await this.schoolRepository.findById(registerDto.schoolId);
      if (!school) {
        throw new NotFoundException(
          `School with id ${registerDto.schoolId} not found`,
        );
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Create parent (schoolId is optional)
    const parent = await this.parentRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      schoolId: registerDto.schoolId,
      passwordHash,
    });

    // Generate JWT tokens
    const { accessToken, refreshToken } = this.generateTokens(parent);

    return new AuthResponseDto(accessToken, refreshToken, parent);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Validate credentials
    const parent = await this.parentRepository.validateCredentials(
      loginDto.email,
      loginDto.password,
    );
    if (!parent) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = this.generateTokens(parent);

    return new AuthResponseDto(accessToken, refreshToken, parent);
  }

  async validateParent(email: string, password: string): Promise<Parent> {
    const parent = await this.parentRepository.validateCredentials(
      email,
      password,
    );
    if (!parent) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return parent;
  }

  async getProfile(parentId: string): Promise<Parent> {
    const parent = await this.parentRepository.findById(parentId);
    if (!parent) {
      throw new UnauthorizedException('Parent not found');
    }
    return parent;
  }

  private generateTokens(parent: Parent): {
    accessToken: string;
    refreshToken: string;
  } {
    const payload: JwtPayload = {
      sub: parent.id,
      email: parent.email,
      schoolId: parent.schoolId ?? null,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }
}
