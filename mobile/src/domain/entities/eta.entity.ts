/**
 * ETA entity
 * Represents estimated time of arrival and related route information
 */
export interface ETA {
  parentId: string;
  distanceMeters: number;
  durationMinutes: number;
  routePolyline: string; // encoded polyline
}
