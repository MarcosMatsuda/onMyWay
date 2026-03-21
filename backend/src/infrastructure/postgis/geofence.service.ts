import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * GeofenceService
 * Handles PostGIS-based geofencing operations
 * Requires PostGIS extension enabled in PostgreSQL database
 */
@Injectable()
export class GeofenceService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Find parents whose latest location is within school's geofence radius
   * Uses PostGIS ST_Distance to calculate geographical distance
   *
   * @param schoolId - School ID to search near
   * @param schoolLat - School latitude coordinate
   * @param schoolLng - School longitude coordinate
   * @param radiusMeters - Geofence radius in meters
   * @returns Array of parent IDs within geofence
   */
  async findParentsNearSchool(
    schoolId: string,
    schoolLat: number,
    schoolLng: number,
    radiusMeters: number,
  ): Promise<string[]> {
    const query = `
      SELECT DISTINCT l.parent_id
      FROM locations l
      JOIN parents p ON l.parent_id = p.id
      WHERE p.school_id = $1
        AND ST_Distance(
          ST_MakePoint(l.lng, l.lat)::geography,
          ST_MakePoint($2, $3)::geography
        ) <= $4
        AND l.timestamp = (
          SELECT MAX(l2.timestamp)
          FROM locations l2
          WHERE l2.parent_id = l.parent_id
        )
      ORDER BY l.parent_id
    `;

    const result = await this.dataSource.query(query, [
      schoolId,
      schoolLng,
      schoolLat,
      radiusMeters,
    ]);

    return result.map((row: any) => row.parent_id);
  }

  /**
   * Check if a location is within a geofence
   *
   * @param lat - Location latitude
   * @param lng - Location longitude
   * @param centerLat - Geofence center latitude
   * @param centerLng - Geofence center longitude
   * @param radiusMeters - Geofence radius in meters
   * @returns true if location is within geofence, false otherwise
   */
  async isLocationWithinGeofence(
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    radiusMeters: number,
  ): Promise<boolean> {
    const query = `
      SELECT ST_Distance(
        ST_MakePoint($1, $2)::geography,
        ST_MakePoint($3, $4)::geography
      ) <= $5 as is_within
    `;

    const result = await this.dataSource.query(query, [
      lng,
      lat,
      centerLng,
      centerLat,
      radiusMeters,
    ]);

    return result[0]?.is_within ?? false;
  }

  /**
   * Calculate distance between two geographical points in meters
   *
   * @param lat1 - First point latitude
   * @param lng1 - First point longitude
   * @param lat2 - Second point latitude
   * @param lng2 - Second point longitude
   * @returns Distance in meters
   */
  async calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<number> {
    const query = `
      SELECT ST_Distance(
        ST_MakePoint($1, $2)::geography,
        ST_MakePoint($3, $4)::geography
      ) as distance_meters
    `;

    const result = await this.dataSource.query(query, [lng1, lat1, lng2, lat2]);

    return parseFloat(result[0]?.distance_meters ?? 0);
  }
}
