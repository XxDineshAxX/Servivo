import type { GeoPoint, ProProfile, NearbyAvailablePro, AvailabilitySlot } from '@servivo/types';
import { haversineDistance, sortByDistance } from './haversine';

/** How far into the future (ms) we consider "available soon" */
const WINDOW_MS = 60 * 60 * 1000; // 60 minutes

/**
 * Given a consumer's location, a list of online pros, and their availability
 * slots, return pros who have at least one slot opening within the next 60
 * minutes — sorted by distance (nearest first).
 *
 * @param consumerLocation  The consumer's current GPS position
 * @param pros              All currently-online ProProfile documents
 * @param slots             All AvailabilitySlot documents from Firestore
 * @param now               Current timestamp in ms (injectable for testing)
 */
export function findAvailableProsNearby(
  consumerLocation: GeoPoint,
  pros: ProProfile[],
  slots: AvailabilitySlot[],
  now: number = Date.now(),
): NearbyAvailablePro[] {
  const windowEnd = now + WINDOW_MS;

  // Build a lookup: proId → earliest slot starting within the window
  const proNextSlot = new Map<string, number>();

  for (const slot of slots) {
    if (slot.startAt <= windowEnd && slot.endAt >= now) {
      const earliest = proNextSlot.get(slot.proId);
      const slotStart = Math.max(slot.startAt, now);
      if (earliest === undefined || slotStart < earliest) {
        proNextSlot.set(slot.proId, slotStart);
      }
    }
  }

  const results: NearbyAvailablePro[] = [];

  for (const pro of pros) {
    if (!pro.isOnline) continue;

    const nextAvailableAt = proNextSlot.get(pro.uid);
    if (nextAvailableAt === undefined) continue;

    const distanceKm = haversineDistance(consumerLocation, pro.location);

    results.push({
      proId: pro.uid,
      proName: pro.displayName,
      distanceKm,
      nextAvailableAt,
      serviceTypes: pro.serviceTypes,
      rating: pro.rating,
      lat: pro.location.lat,
      lng: pro.location.lng,
    });
  }

  return sortByDistance(results);
}

/**
 * Check if a pro has any availability in the next 60 minutes.
 * Lightweight helper for per-pro checks.
 */
export function isProAvailableSoon(
  proId: string,
  slots: AvailabilitySlot[],
  now: number = Date.now(),
): boolean {
  const windowEnd = now + WINDOW_MS;
  return slots.some(
    (s) => s.proId === proId && s.startAt <= windowEnd && s.endAt >= now,
  );
}
