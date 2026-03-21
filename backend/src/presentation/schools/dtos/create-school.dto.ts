import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchoolDto {
  @ApiProperty({
    example: 'Springfield Elementary',
    description: 'School name',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: -23.5505,
    description: 'School latitude (-90 to 90)',
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    example: -46.6333,
    description: 'School longitude (-180 to 180)',
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    example: 1000,
    description: 'Geofence radius in meters (default: 1000)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(5000)
  geofenceRadiusMeters?: number;

  @ApiProperty({
    example: 500,
    description: 'Notification threshold in meters (default: 500)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  notificationThresholdMeters?: number;
}
