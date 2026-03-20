/**
 * OSRM Route Response Interface
 * Based on OSRM API response format
 */
export interface OSRMRouteResponse {
  code: string;
  routes: Array<{
    distance: number; // in meters
    duration: number; // in seconds
    geometry: string; // encoded polyline string
    legs: Array<{
      distance: number;
      duration: number;
      steps: any[];
      summary: string;
    }>;
  }>;
  waypoints: Array<{
    location: [number, number]; // [longitude, latitude]
    name: string;
  }>;
}

/**
 * OSRM Route Request Interface
 */
export interface OSRMRouteRequest {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

/**
 * OSRM Route Result Interface
 */
export interface OSRMRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
}

/**
 * OSRM Service Configuration Interface
 */
export interface OSRMConfig {
  baseUrl: string;
  timeout?: number;
}
