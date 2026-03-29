import { IsEmail, IsString, IsUUID, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolAdminDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Admin full name' })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    example: 'jane@school.com',
    description: 'Admin email address (must be unique)',
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
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'School UUID the admin belongs to',
  })
  @IsUUID('4', { message: 'schoolId must be a valid UUID' })
  schoolId: string;
}
