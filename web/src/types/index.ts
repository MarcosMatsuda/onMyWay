export interface AuthResponse {
  token: string;
  parent: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ETA {
  parentId: string;
  distanceMeters: number;
  durationSeconds: number;
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
