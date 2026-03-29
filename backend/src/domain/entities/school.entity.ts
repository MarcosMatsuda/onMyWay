export interface School {
  id: string;
  name: string;
  lat: number;
  lng: number;
  geofenceRadiusMeters: number;
  notificationThresholdMeters: number;
  inviteCode: string;
  createdAt: Date;
}
