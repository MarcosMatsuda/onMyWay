import {
  Injectable,
  UnauthorizedException,
  ConflictException,
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
import { JwtPayload } from '../../infrastructure/auth/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PARENT_REPOSITORY)
    private readonly parentRepository: IParentRepository,
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    // Create parent
    const parent = await this.parentRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      phone: registerDto.phone,
      schoolId: registerDto.schoolId,
      passwordHash,
    });

    // Generate JWT token
    const token = this.generateToken(parent);

    return new AuthResponseDto(token, parent);
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

    // Generate JWT token
    const token = this.generateToken(parent);

    return new AuthResponseDto(token, parent);
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

  private generateToken(parent: Parent): string {
    const payload: JwtPayload = {
      sub: parent.id,
      email: parent.email,
    };
    return this.jwtService.sign(payload);
  }
}
