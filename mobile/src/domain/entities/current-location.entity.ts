/**
 * CurrentLocation entity
 * Represents the parent's current geographical location
 */
export interface CurrentLocation {
  lat: number;
  lng: number;
  accuracy: number; // meters
  timestamp: number; // unix ms
}
