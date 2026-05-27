import { useState, useEffect } from 'react';
import type { GeoPoint, NearbyAvailablePro, ProProfile, AvailabilitySlot } from '@servivo/types';
import { subscribeOnlinePros, fetchSoonAvailability } from '@servivo/firebase';
import { findAvailableProsNearby } from '@servivo/scheduling';

interface NearbyProsState {
  pros: NearbyAvailablePro[];
  loading: boolean;
  error: string | null;
}

/**
 * Subscribes to online pros via Firestore, fetches upcoming availability slots,
 * then runs the Haversine sort to return nearby available pros in real time.
 */
export function useNearbyPros(consumerLocation: GeoPoint | null): NearbyProsState {
  const [state, setState] = useState<NearbyProsState>({
    pros: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!consumerLocation) return;

    setState((s) => ({ ...s, loading: true }));

    let onlinePros: ProProfile[] = [];

    const processUpdate = async () => {
      try {
        const slots: AvailabilitySlot[] = await fetchSoonAvailability();
        const sorted = findAvailableProsNearby(consumerLocation, onlinePros, slots);
        setState({ pros: sorted, loading: false, error: null });
      } catch (e) {
        setState({ pros: [], loading: false, error: (e as Error).message });
      }
    };

    // Subscribe to live pro list
    const unsubscribe = subscribeOnlinePros((pros) => {
      onlinePros = pros;
      processUpdate();
    });

    return unsubscribe;
  }, [consumerLocation?.lat, consumerLocation?.lng]);

  return state;
}
