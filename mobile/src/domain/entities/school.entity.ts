/**
 * School entity
 * Represents a school/institution that parents are associated with
 */
export interface School {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}
