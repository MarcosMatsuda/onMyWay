export interface ETA {
  id: string;
  parentId: string;
  schoolId: string;
  distanceMeters: number;
  durationSeconds: number;
  routePolyline: string;
  calculatedAt: Date;
}
