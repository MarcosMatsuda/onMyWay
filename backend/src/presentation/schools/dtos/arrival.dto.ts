export class ArrivalDto {
  parentId: string;
  parentName: string;
  lat: number;
  lng: number;
  etaMinutes: number;
  distanceMeters: number;
  calculatedAt: Date;
}

export class ArrivalsResponseDto {
  schoolName: string;
  totalCount: number;
  arrivals: ArrivalDto[];
}
