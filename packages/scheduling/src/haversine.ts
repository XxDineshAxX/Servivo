import type { GeoPoint } from '@servivo/types';

const EARTH_RADIUS_KM = 6371;

/**
 * Compute the great-circle distance between two geographic coordinates
 * using the Haversine formula.
 *
 * @returns Distance in kilometres
 */
export function haversineDistance(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Sort an array of objects that carry a `distanceKm` field, ascending.
 */
export function sortByDistance<T extends { distanceKm: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.distanceKm - b.distanceKm);
}
