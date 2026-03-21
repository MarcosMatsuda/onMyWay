export class LocationResponseDto {
  id: string;
  parentId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: Date;
  isWithinGeofence: boolean;
  eta?: {
    id: string;
    durationSeconds: number;
    distanceMeters: number;
    routePolyline: string;
    calculatedAt: Date;
  };
}
