import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Parent full name (min 2 characters)',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address (must be unique)',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePass123',
    description:
      'Password (min 8 chars, must contain uppercase, lowercase, and number)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    example: '+5511987654321',
    description: 'Phone number (E.164 format, optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number',
  })
  phone?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'School UUID (optional, can be selected after registration)',
    required: false,
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiProperty({
    example: 'AB3X7Y2Z',
    description:
      'School invite code (8 uppercase alphanumeric characters, optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Invite code must be 8 characters long' })
  @Matches(/^[A-Z0-9]{8}$/, {
    message: 'Invite code must be 8 uppercase alphanumeric characters',
  })
  inviteCode?: string;
}
