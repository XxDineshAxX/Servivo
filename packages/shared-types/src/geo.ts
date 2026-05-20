export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProximityResult {
  proId: string;
  distanceKm: number;
  estimatedArrivalMinutes: number;
}
