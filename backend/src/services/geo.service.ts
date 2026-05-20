/**
 * Geo Service
 * Utility functions for distance calculation and location operations.
 */

const EARTH_RADIUS_KM = 6371;
const AVG_URBAN_SPEED_KMH = 30;

export class GeoService {
  /**
   * Haversine formula — straight-line distance between two lat/lng points.
   */
  haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Rough drive-time estimate based on average urban speed.
   */
  estimateDriveMinutes(distanceKm: number): number {
    return Math.ceil((distanceKm / AVG_URBAN_SPEED_KMH) * 60);
  }
}
