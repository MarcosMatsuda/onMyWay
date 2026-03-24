export interface School {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}
