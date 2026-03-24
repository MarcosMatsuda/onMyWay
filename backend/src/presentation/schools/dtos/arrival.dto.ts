import { ApiProperty } from '@nestjs/swagger';

export class ArrivalDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Parent ID',
  })
  parentId: string;

  @ApiProperty({
    example: 450,
    description: 'Distance to school in meters',
  })
  distanceMeters: number;

  @ApiProperty({
    example: 3,
    description: 'Estimated time to arrival in minutes',
  })
  durationMinutes: number;

  @ApiProperty({
    example: 'encoded_polyline_string',
    description: 'Encoded polyline route',
  })
  routePolyline: string;
}

export class ArrivalsResponseDto {
  @ApiProperty({
    description: 'School name',
  })
  schoolName: string;

  @ApiProperty({
    description: 'Total number of arrivals',
  })
  totalCount: number;

  @ApiProperty({
    description: 'Array of arrivals',
    type: [ArrivalDto],
  })
  arrivals: ArrivalDto[];
}
