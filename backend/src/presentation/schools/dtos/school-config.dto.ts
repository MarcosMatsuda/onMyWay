import { IsNumber, Min, Max } from 'class-validator';

export class SchoolConfigDto {
  @IsNumber()
  @Min(100)
  @Max(5000)
  geofenceRadiusMeters: number;

  @IsNumber()
  @Min(100)
  @Max(10000)
  notificationThresholdMeters: number;
}

export class SchoolStatsDto {
  totalParents: number;
  avgETA: number;
  etaLessThan5Min: number;
  eta5To15Min: number;
  etaGreaterThan15Min: number;
}
