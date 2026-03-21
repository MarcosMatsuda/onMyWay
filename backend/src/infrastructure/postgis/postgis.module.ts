import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';

/**
 * PostGIS Module
 * Provides PostGIS-based geographical and spatial query services
 * Requires PostgreSQL with PostGIS extension enabled
 */
@Module({
  providers: [GeofenceService],
  exports: [GeofenceService],
})
export class PostGISModule {}
