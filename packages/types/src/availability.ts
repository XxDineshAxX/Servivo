/** A single availability slot for a pro */
export interface AvailabilitySlot {
  proId: string;
  /** Start of available window — Unix ms */
  startAt: number;
  /** End of available window — Unix ms */
  endAt: number;
}

/** Result from the scheduling query */
export interface NearbyAvailablePro {
  proId: string;
  proName: string;
  distanceKm: number;
  /** Earliest available slot within the next 60 minutes */
  nextAvailableAt: number;
  serviceTypes: string[];
  rating: number;
  lat: number;
  lng: number;
}
