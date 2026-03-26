export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  parent: {
    id: string;
    name: string;
    email: string;
    schoolId: string;
  };
}

export interface ETA {
  parentId: string;
  distanceMeters: number;
  durationMinutes: number;
  routePolyline: string;
}

export interface Arrival {
  parentId: string;
  parentName: string;
  eta: ETA;
}

export interface SchoolStats {
  totalParents: number;
  arrivingCount: number;
  avgETA: number;
}
