import { ApiProperty } from '@nestjs/swagger';

export class SchoolResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'School ID',
  })
  id: string;

  @ApiProperty({
    example: 'Springfield Elementary',
    description: 'School name',
  })
  name: string;

  @ApiProperty({
    example: -23.5505,
    description: 'School latitude',
  })
  lat: number;

  @ApiProperty({
    example: -46.6333,
    description: 'School longitude',
  })
  lng: number;

  @ApiProperty({
    example: 1000,
    description: 'Geofence radius in meters',
  })
  geofenceRadiusMeters: number;

  @ApiProperty({
    example: 500,
    description: 'Notification threshold in meters',
  })
  notificationThresholdMeters: number;

  @ApiProperty({
    example: '2024-03-20T10:00:00Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;
}

export class SchoolListResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'School ID',
  })
  id: string;

  @ApiProperty({
    example: 'Springfield Elementary',
    description: 'School name',
  })
  name: string;

  @ApiProperty({
    example: -23.5505,
    description: 'School latitude',
  })
  lat: number;

  @ApiProperty({
    example: -46.6333,
    description: 'School longitude',
  })
  lng: number;
}
