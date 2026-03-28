export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    schoolId: string;
    createdAt: string;
  };
}

export interface SchoolLocation {
  lat: number;
  lng: number;
}

export interface School {
  id: string;
  name: string;
  location: SchoolLocation;
  geofenceRadiusMeters: number;
  notificationThresholdMeters: number;
}

export interface Arrival {
  parentId: string;
  distanceMeters: number;
  durationMinutes: number;
  routePolyline: string;
}

export interface SchoolStats {
  totalParents: number;
  avgETA: number;
  etaLessThan5Min: number;
  eta5To15Min: number;
  etaGreaterThan15Min: number;
}

export interface SchoolConfig {
  geofenceRadiusMeters: number;
  notificationThresholdMeters: number;
}
