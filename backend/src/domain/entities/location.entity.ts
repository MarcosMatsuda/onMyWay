export interface Location {
  id: string;
  parentId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}
